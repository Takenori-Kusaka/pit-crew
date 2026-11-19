// Claude Code session transcript -> trajectory: tool calls paired with results, denials, sidechain
// flag, prompts, final message, and the unknown line types counted rather than dropped silently.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeClaudeTranscript, withoutSidechain } from '../src/normalize/claude-transcript.mjs';
import { toolCalls } from '../src/normalize/claude-stream.mjs';

const lines = [
  { type: 'queue-operation', operation: 'enqueue', timestamp: '2026-10-23T10:14:50.000Z', sessionId: 's-1', content: 'x' },
  { type: 'user', uuid: 'u1', sessionId: 's-1', cwd: 'E:\\Github\\gq', timestamp: '2026-10-23T10:14:51.000Z', entrypoint: 'claude-desktop', message: { role: 'user', content: 'PR #5091 をレビューして' } },
  { type: 'assistant', uuid: 'a1', parentUuid: 'u1', isSidechain: false, timestamp: '2026-10-23T10:14:55.000Z', message: { model: 'claude-opus-5-5', role: 'assistant', content: [
    { type: 'thinking', thinking: 'secret reasoning' },
    { type: 'text', text: 'まず差分を読みます。' },
    { type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'gh pr diff 5091' } },
    { type: 'tool_use', id: 't2', name: 'Read', input: { file_path: 'E:\\Github\\gq\\docs\\x.md' } },
  ] } },
  { type: 'user', uuid: 'u2', parentUuid: 'a1', timestamp: '2026-10-23T10:14:56.000Z', permissionDecision: { decision: 'accept' }, message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: [{ type: 'text', text: 'diff --git a/x b/x' }] }] } },
  { type: 'user', uuid: 'u3', parentUuid: 'a1', timestamp: '2026-10-23T10:14:57.000Z', permissionDecision: { decision: 'deny', source: 'user' }, message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't2', is_error: true, content: 'denied' }] } },
  { type: 'assistant', uuid: 'a2', isSidechain: true, timestamp: '2026-10-23T10:15:00.000Z', message: { model: 'claude-opus-5-5', role: 'assistant', content: [{ type: 'tool_use', id: 't3', name: 'Grep', input: { pattern: 'foo', path: 'src' } }] } },
  { type: 'user', uuid: 'u4', isSidechain: true, timestamp: '2026-10-23T10:15:01.000Z', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't3', content: 'src/a.ts:1:foo' }] } },
  { type: 'assistant', uuid: 'a3', isSidechain: false, timestamp: '2026-10-23T10:15:05.000Z', message: { model: 'claude-opus-5-5', role: 'assistant', content: [{ type: 'text', text: '差分は 1 ファイル。承認は lead が行います。' }] } },
  { type: 'cost-state', timestamp: '2026-10-23T10:15:06.000Z', content: {} },
].map((o) => JSON.stringify(o)).join('\n');

test('pairs tool calls with results, flags denials, keeps thinking out of the message', () => {
  const t = normalizeClaudeTranscript(lines);
  assert.equal(t.session_id, 's-1');
  assert.equal(t.agent.model, 'claude-opus-5-5');
  assert.equal(t.extra.pitwall.cwd, 'E:\\Github\\gq');
  const calls = toolCalls(t);
  assert.deepEqual(calls.map((c) => c.function_name), ['Bash', 'Read', 'Grep']);
  assert.equal(calls[0].extra.kind, 'execute');
  assert.equal(calls[0].extra.result.text, 'diff --git a/x b/x');
  assert.equal(calls[1].extra.denied, true);
  assert.deepEqual(calls[1].extra.locations, [{ path: 'E:\\Github\\gq\\docs\\x.md' }]);
  assert.equal(t.extra.pitwall.permission_denials.length, 1);
  assert.ok(!JSON.stringify(t.steps.map((s) => s.message)).includes('secret reasoning'));
  assert.equal(t.final_message, '差分は 1 ファイル。承認は lead が行います。');
  assert.deepEqual(t.extra.pitwall.user_prompts.map((p) => p.text), ['PR #5091 をレビューして']);
  assert.equal(t.extra.pitwall.started_at, '2026-10-23T10:14:50.000Z');
  assert.equal(t.extra.pitwall.ended_at, '2026-10-23T10:15:06.000Z');
});

test('sidechain steps are flagged and can be dropped; odd line types are counted, not lost', () => {
  const t = normalizeClaudeTranscript(lines);
  assert.equal(t.extra.pitwall.sidechain_steps, 1);
  const lead = withoutSidechain(t);
  assert.deepEqual(toolCalls(lead).map((c) => c.function_name), ['Bash', 'Read']);
  assert.equal(t.extra.pitwall.line_types['queue-operation'], 1);
  assert.equal(t.extra.pitwall.line_types['cost-state'], 1);
});
