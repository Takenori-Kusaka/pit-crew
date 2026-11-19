// Normalize a Claude Code stream-json trace (trace.jsonl from `claude plugin eval`)
// into pit-wall's trajectory format: ATIF-shaped outer structure, with ACP-style
// `kind` / `locations` on each tool call under `extra`.
//
// The trajectory is the only thing pit-wall graders read, so any runner that can
// produce it (claude plugin eval, Harbor, ...) can be graded the same way.

export const TRAJECTORY_SCHEMA = 'pitwall-trajectory/0.1 (ATIF-v1.8-shaped)';

// Tool name -> ACP-style kind. Unknown tools fall back to 'other'.
const KIND_BY_TOOL = {
  Read: 'read', NotebookRead: 'read', Glob: 'search', Grep: 'search',
  Write: 'edit', Edit: 'edit', MultiEdit: 'edit', NotebookEdit: 'edit',
  Bash: 'execute', PowerShell: 'execute',
  WebFetch: 'fetch', WebSearch: 'fetch',
  Skill: 'skill', Agent: 'delegate', Task: 'delegate',
  AskUserQuestion: 'ask',
};

export function toolKind(name) {
  if (KIND_BY_TOOL[name]) return KIND_BY_TOOL[name];
  if (name.startsWith('mcp__')) return 'mcp';
  return 'other';
}

function locationsOf(name, input = {}) {
  const p = input.file_path ?? input.notebook_path ?? input.path;
  return p ? [{ path: p }] : [];
}

export function normalizeClaudeStream(jsonlText, meta = {}) {
  const lines = jsonlText.split('\n').filter((l) => l.trim());
  const steps = [];
  const pending = new Map(); // tool_use_id -> tool call object
  const traj = {
    schema_version: TRAJECTORY_SCHEMA,
    session_id: null,
    agent: { name: 'claude-code', version: null, model: null },
    steps,
    final_message: '',
    extra: { pitwall: { runner: meta.runner ?? 'claude-plugin-eval', arm: meta.arm ?? null, rate_limits: [], permission_denials: [], cost_usd: null, turns: null } },
  };
  let stepId = 0;
  for (const line of lines) {
    let m;
    try { m = JSON.parse(line); } catch { continue; }
    if (m.type === 'system' && m.subtype === 'init') {
      traj.session_id = m.session_id;
      traj.agent.version = m.claude_code_version ?? null;
      traj.agent.model = m.model ?? null;
      traj.extra.pitwall.skills_available = m.skills ?? [];
      continue;
    }
    if (m.type === 'system' && m.subtype === 'permission_denied') {
      traj.extra.pitwall.permission_denials.push({ tool: m.tool_name, tool_call_id: m.tool_use_id });
      const call = pending.get(m.tool_use_id);
      if (call) call.extra.denied = true;
      continue;
    }
    if (m.type === 'rate_limit_event') { traj.extra.pitwall.rate_limits.push(m.rate_limit_info); continue; }
    if (m.type === 'result') {
      traj.extra.pitwall.cost_usd = m.total_cost_usd ?? null;
      traj.extra.pitwall.turns = m.num_turns ?? null;
      traj.extra.pitwall.usage = m.usage ?? null;
      if (typeof m.result === 'string' && m.result) traj.final_message = m.result;
      continue;
    }
    const content = m.message?.content;
    if (m.type === 'assistant' && Array.isArray(content)) {
      const step = { step_id: ++stepId, source: 'agent', message: '', tool_calls: [] };
      for (const b of content) {
        if (b.type === 'text') step.message += b.text;
        if (b.type === 'tool_use') {
          const call = {
            tool_call_id: b.id,
            function_name: b.name,
            arguments: b.input ?? {},
            extra: { kind: toolKind(b.name), locations: locationsOf(b.name, b.input), denied: false, result: null },
          };
          step.tool_calls.push(call);
          pending.set(b.id, call);
        }
      }
      if (step.message) traj.final_message = step.message;
      steps.push(step);
    }
    if (m.type === 'user' && Array.isArray(content)) {
      for (const b of content) {
        if (b.type !== 'tool_result') continue;
        const call = pending.get(b.tool_use_id);
        if (!call) continue;
        const text = Array.isArray(b.content) ? b.content.map((c) => c.text ?? '').join('') : String(b.content ?? '');
        call.extra.result = { is_error: !!b.is_error, text };
      }
    }
  }
  return traj;
}

// All tool calls in order, flattened (what most graders want).
export function toolCalls(traj) {
  return traj.steps.flatMap((s) => s.tool_calls);
}
