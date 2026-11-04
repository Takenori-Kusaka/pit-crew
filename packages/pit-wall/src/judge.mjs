// pit-wall's own LLM judge: the same judge for every runner, so verdicts do not
// depend on which runner produced the trajectory.
//
// The judge sees the task, the actions the agent took (commands and edits, not
// reads) and the final reply, and returns PASS / FAIL with a reason. It runs as a
// tool-less, settings-less `claude -p` in an empty directory, on the subscription
// (ANTHROPIC_API_KEY is removed so it can never fall back to metered billing).

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { toolCalls } from './normalize/claude-stream.mjs';

const SYSTEM = [
  'You grade one run of an AI coding agent against a rubric.',
  'Judge only what the agent did and said. Do not reward intentions it did not act on, and do not penalize style.',
  'Quote the decisive sentence or command in your reason.',
].join(' ');

const SCHEMA = {
  type: 'object',
  properties: { verdict: { enum: ['PASS', 'FAIL'] }, reason: { type: 'string' } },
  required: ['verdict', 'reason'],
  additionalProperties: false,
};

// The part of a trajectory a judge needs: actions with an effect, then the reply.
export function judgeView(traj, task) {
  const actions = toolCalls(traj)
    .filter((c) => ['execute', 'edit', 'delegate', 'mcp'].includes(c.extra.kind))
    .map((c) => `- ${c.function_name}: ${String(c.arguments.command ?? c.arguments.file_path ?? JSON.stringify(c.arguments)).slice(0, 400)}`);
  return [
    '## Task given to the agent', task.trim(), '',
    '## Actions the agent took (commands and edits)', actions.length ? actions.join('\n') : '(none)', '',
    '## Final reply of the agent', traj.final_message.trim() || '(empty)',
  ].join('\n');
}

// One tool-less, settings-less model call that returns JSON matching `schema`.
// Throws on failure. Shared by the judge and the calibration translator.
export function claudeJson({ system, prompt, schema, model, claude = process.env.PITWALL_CLAUDE ?? 'claude' }) {
  const cwd = mkdtempSync(join(tmpdir(), 'pitwall-claude-'));
  try {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    const r = spawnSync(claude, ['-p', '--model', model, '--tools', '', '--setting-sources', '', '--no-session-persistence',
      '--system-prompt', system, '--json-schema', JSON.stringify(schema), '--output-format', 'json'],
    { cwd, env, input: prompt, encoding: 'utf8', maxBuffer: 16 << 20, timeout: 300_000 });
    if (r.status !== 0) throw new Error(`claude exited ${r.status}: ${(r.stderr || r.stdout).slice(-300)}`);
    const out = JSON.parse(r.stdout);
    return out.structured_output ?? JSON.parse(out.result);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

export function judge({ rubric, view, model = 'haiku', claude }) {
  try {
    const prompt = `# Rubric\n${rubric.trim()}\n\n# Run to grade\n${view}\n`;
    const v = claudeJson({ system: SYSTEM, prompt, schema: SCHEMA, model, claude });
    return { passed: v.verdict === 'PASS', reason: v.reason, model };
  } catch (e) {
    return { passed: null, error: String(e.message ?? e).slice(0, 300) };
  }
}
