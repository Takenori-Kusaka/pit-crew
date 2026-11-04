// Normalize an ATIF trajectory (Harbor's trajectory.json, v1.x) into pit-wall's
// trajectory format. The outer shape is already ATIF; this adds the ACP-style
// `kind` / `locations` and `result` on each tool call, and `final_message`.

import { TRAJECTORY_SCHEMA, toolKind } from './claude-stream.mjs';

const DENIED = /^Permission to use \S+ has been denied/;

function resultText(r) {
  if (!r) return '';
  const c = r.content;
  if (Array.isArray(c)) return c.map((x) => x.text ?? '').join('');
  return String(c ?? '');
}

export function normalizeAtif(atif, meta = {}) {
  const traj = {
    schema_version: TRAJECTORY_SCHEMA,
    session_id: atif.session_id ?? null,
    agent: { name: atif.agent?.name ?? null, version: atif.agent?.version ?? null, model: atif.agent?.model_name ?? null },
    steps: [],
    final_message: '',
    extra: { pitwall: { runner: meta.runner ?? 'harbor', source_schema: atif.schema_version, rate_limits: [], permission_denials: [], cost_usd: atif.final_metrics?.total_cost_usd ?? null, turns: atif.final_metrics?.total_steps ?? null } },
  };
  for (const s of atif.steps ?? []) {
    // The task instruction is what the agent was shown before any tool call; the process
    // graders count it as a source the agent may cite (graders/process/visibility.mjs).
    if (s.source === 'user' && !traj.steps.length) {
      const m = typeof s.message === 'string' ? s.message : resultText({ content: s.message });
      traj.extra.pitwall.instruction = [traj.extra.pitwall.instruction, m].filter(Boolean).join('\n');
    }
    if (s.source !== 'agent') continue;
    const results = new Map((s.observation?.results ?? []).map((r) => [r.source_call_id, r]));
    const tool_calls = (s.tool_calls ?? []).map((c) => {
      const r = results.get(c.tool_call_id);
      const text = resultText(r);
      const meta = r?.extra?.tool_result_metadata ?? {};
      const denied = DENIED.test(text);
      if (denied) traj.extra.pitwall.permission_denials.push({ tool: c.function_name, tool_call_id: c.tool_call_id });
      const isError = meta.is_error ?? r?.extra?.is_error ?? (denied || /^Exit code [1-9]/.test(text));
      const input = c.arguments ?? {};
      const p = input.file_path ?? input.notebook_path ?? input.path;
      return {
        tool_call_id: c.tool_call_id,
        function_name: c.function_name,
        arguments: input,
        extra: { kind: toolKind(c.function_name), locations: p ? [{ path: p }] : [], denied, result: r ? { is_error: !!isError, text } : null },
      };
    });
    const message = typeof s.message === 'string' ? s.message : resultText({ content: s.message });
    traj.steps.push({ step_id: s.step_id, source: 'agent', message, tool_calls });
    if (message.trim()) traj.final_message = message;
  }
  return traj;
}
