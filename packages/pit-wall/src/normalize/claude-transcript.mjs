// Normalize a Claude Code SESSION TRANSCRIPT (~/.claude/projects/<proj>/<session>.jsonl, the file
// Claude Code writes for interactive sessions) into pit-wall's trajectory format, so the same graders
// that read Harbor runs can read a real role session (owner 2026-11-11: "実セッション → B 採点").
//
// Differences from the stream-json trace (claude-stream.mjs):
//   - lines carry `type` in {user, assistant, system, attachment, queue-operation, last-prompt,
//     api-request*, file-history-snapshot, cost-state, ...}; only user/assistant hold messages
//   - assistant content blocks include `thinking` (kept out of `message`), `text`, `tool_use`
//   - user lines with `tool_result` also carry `permissionDecision` (deny → denied call) and `toolUseResult`
//   - `isSidechain: true` marks subagent turns; they are kept but flagged (`extra.sidechain`) so a
//     grader can read the lead's own actions apart from delegated work
//   - no `result` line: final_message = the last assistant text; cost is not in the file
import { toolKind, TRAJECTORY_SCHEMA } from './claude-stream.mjs';

function locationsOf(input = {}) {
  const p = input.file_path ?? input.notebook_path ?? input.path;
  return p ? [{ path: p }] : [];
}

export function normalizeClaudeTranscript(jsonlText, meta = {}) {
  const lines = String(jsonlText).split('\n').filter((l) => l.trim());
  const steps = [];
  const pending = new Map();
  const traj = {
    schema_version: TRAJECTORY_SCHEMA,
    session_id: null,
    agent: { name: 'claude-code', version: null, model: null },
    steps,
    final_message: '',
    extra: { pitwall: { runner: meta.runner ?? 'claude-transcript', arm: meta.arm ?? null, cwd: null, entrypoint: null, started_at: null, ended_at: null, user_prompts: [], rate_limits: [], permission_denials: [], sidechain_steps: 0, line_types: {} } },
  };
  const pw = traj.extra.pitwall;
  let stepId = 0;
  for (const line of lines) {
    let m;
    try { m = JSON.parse(line); } catch { pw.line_types['<unparsable>'] = (pw.line_types['<unparsable>'] ?? 0) + 1; continue; }
    pw.line_types[m.type] = (pw.line_types[m.type] ?? 0) + 1;
    if (m.sessionId && !traj.session_id) traj.session_id = m.sessionId;
    if (m.cwd && !pw.cwd) pw.cwd = m.cwd;
    if (m.entrypoint && !pw.entrypoint) pw.entrypoint = m.entrypoint;
    if (m.version && !traj.agent.version) traj.agent.version = m.version;
    if (m.timestamp) { pw.started_at ??= m.timestamp; pw.ended_at = m.timestamp; }
    if (m.type === 'rate_limit_event') { pw.rate_limits.push(m.rate_limit_info ?? m); continue; }
    const content = m.message?.content;
    if (m.type === 'assistant' && Array.isArray(content)) {
      if (m.message?.model && !traj.agent.model) traj.agent.model = m.message.model;
      const step = { step_id: ++stepId, source: 'agent', message: '', tool_calls: [], extra: { sidechain: !!m.isSidechain, uuid: m.uuid ?? null, timestamp: m.timestamp ?? null } };
      if (m.isSidechain) pw.sidechain_steps++;
      for (const b of content) {
        if (b.type === 'text') step.message += b.text;
        if (b.type === 'tool_use') {
          const call = { tool_call_id: b.id, function_name: b.name, arguments: b.input ?? {}, extra: { kind: toolKind(b.name), locations: locationsOf(b.input), denied: false, result: null, sidechain: !!m.isSidechain } };
          step.tool_calls.push(call);
          pending.set(b.id, call);
        }
      }
      if (step.message && !m.isSidechain) traj.final_message = step.message;
      steps.push(step);
      continue;
    }
    if (m.type === 'user') {
      if (typeof content === 'string') { pw.user_prompts.push({ text: content, timestamp: m.timestamp ?? null }); continue; }
      if (!Array.isArray(content)) continue;
      for (const b of content) {
        if (b.type === 'text') { pw.user_prompts.push({ text: b.text, timestamp: m.timestamp ?? null }); continue; }
        if (b.type !== 'tool_result') continue;
        const call = pending.get(b.tool_use_id);
        if (!call) continue;
        const text = Array.isArray(b.content) ? b.content.map((c) => c.text ?? '').join('') : String(b.content ?? '');
        call.extra.result = { is_error: !!b.is_error, text };
        if (m.permissionDecision?.decision && m.permissionDecision.decision !== 'accept') { call.extra.denied = true; pw.permission_denials.push({ tool: call.function_name, tool_call_id: call.tool_call_id, decision: m.permissionDecision.decision }); }
      }
    }
  }
  return traj;
}

// Lead-only view: steps and tool calls made by the session itself, not by its subagents.
export function withoutSidechain(traj) {
  return { ...traj, steps: traj.steps.filter((s) => !s.extra?.sidechain) };
}
