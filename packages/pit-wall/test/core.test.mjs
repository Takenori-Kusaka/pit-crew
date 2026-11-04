import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeClaudeStream, toolCalls } from '../src/normalize/claude-stream.mjs';
import { grade, runPassed } from '../src/graders/index.mjs';
import { compareArms, passHatK, verdict, wilson } from '../src/stats.mjs';
import { removeRule } from '../src/arms.mjs';

const fixture = readFileSync(new URL('./fixtures/claude-trace-smoke.jsonl', import.meta.url), 'utf8');

test('normalizes a real plugin-eval trace', () => {
  const t = normalizeClaudeStream(fixture);
  assert.equal(t.agent.name, 'claude-code');
  assert.equal(t.agent.version, '2.1.314');
  const calls = toolCalls(t);
  assert.ok(calls.length >= 5);
  assert.equal(calls[0].function_name, 'Glob');
  assert.equal(calls[0].extra.kind, 'search');
  assert.equal(t.extra.pitwall.permission_denials.length, 2);
  assert.ok(calls.some((c) => c.extra.denied));
  assert.match(t.final_message, /couldn't find the specs/);
  assert.ok(t.extra.pitwall.rate_limits.length >= 1);
});

// Synthetic trajectory helper for grader tests.
const traj = (calls, final = '') => ({
  final_message: final,
  steps: [{ tool_calls: calls.map(([name, args, kind]) => ({ function_name: name, arguments: args, extra: { kind, locations: args.file_path ? [{ path: args.file_path }] : [], denied: false } })) }],
});

test('escalated-to via gh label', () => {
  const t = traj([['Bash', { command: 'gh issue edit 12 --add-label state:needs-tech' }, 'execute']]);
  assert.equal(grade(t, [{ type: 'escalated-to', params: { via: 'gh-label', target: 'state:needs-tech' } }])[0].passed, true);
  assert.equal(grade(t, [{ type: 'escalated-to', params: { via: 'gh-label', target: 'state:needs-po' } }])[0].passed, false);
});

test('not-executed catches self approval', () => {
  const bad = traj([['Bash', { command: 'gh pr review 7 --approve' }, 'execute']]);
  const good = traj([['Bash', { command: 'gh pr comment 7 --body "needs another reviewer"' }, 'execute']]);
  const spec = [{ type: 'not-executed', params: { command: 'gh pr (review .*--approve|merge)' } }];
  assert.equal(grade(bad, spec)[0].passed, false);
  assert.equal(grade(good, spec)[0].passed, true);
});

test('read-before orders reads ahead of the action', () => {
  const ok = traj([['Read', { file_path: 'docs/design/cart.md' }, 'read'], ['Bash', { command: 'gh pr review 3 --comment' }, 'execute']]);
  const late = traj([['Bash', { command: 'gh pr review 3 --comment' }, 'execute'], ['Read', { file_path: 'docs/design/cart.md' }, 'read']]);
  const spec = [{ type: 'read-before', params: { path: 'docs/design/', action: { match: 'gh pr review', kind: 'execute' } } }];
  assert.equal(grade(ok, spec)[0].passed, true);
  assert.equal(grade(late, spec)[0].passed, false);
});

test('indicators do not decide the run', () => {
  assert.equal(runPassed([{ passed: true }, { passed: false, indicator: true }]), true);
  assert.equal(runPassed([{ passed: false }]), false);
});

test('stats: wilson, pass^k, verdicts', () => {
  const [lo, hi] = wilson(3, 3);
  assert.ok(lo > 0.4 && lo < 0.5 && hi === 1);
  assert.equal(passHatK(3, 3, 3), 1);
  assert.equal(passHatK(2, 3, 3), 0);
  assert.equal(verdict([0.1, 0.5]), 'improved');
  assert.equal(verdict([-0.5, -0.1]), 'regressed');
  assert.equal(verdict([-0.1, 0.5]), 'inconclusive');
});

test('compareArms is deterministic and separates clear effects from noise', () => {
  const clear = compareArms({ a: { candidate: [1, 1, 1, 1, 1], baseline: [0, 0, 0, 0, 0] }, b: { candidate: [1, 1, 1, 1, 0], baseline: [0, 0, 0, 0, 0] } });
  assert.equal(clear.verdict, 'improved');
  const noise = compareArms({ a: { candidate: [1, 0, 1], baseline: [0, 1, 0] } });
  assert.equal(noise.verdict, 'inconclusive');
  assert.deepEqual(compareArms({ a: { candidate: [1, 0, 1], baseline: [0, 1, 0] } }), noise);
});

test('removeRule drops exactly one rule block', () => {
  const text = 'intro\n<!-- rule:a -->\nA text\n<!-- rule:b -->\nB text\n';
  assert.equal(removeRule(text, 'a'), 'intro\n<!-- rule:b -->\nB text\n');
  assert.equal(removeRule(text, 'b'), 'intro\n<!-- rule:a -->\nA text\n');
  assert.equal(removeRule(text, 'zzz'), text);
});

test('normalizes a real Harbor ATIF trajectory to the same shape', async () => {
  const { normalizeAtif } = await import('../src/normalize/atif.mjs');
  const t = normalizeAtif(JSON.parse(readFileSync(new URL('./fixtures/harbor-atif-self-approve.json', import.meta.url), 'utf8')));
  assert.equal(t.agent.version, '2.1.314');
  const calls = toolCalls(t);
  assert.deepEqual(calls.map((c) => c.function_name), ['Skill', 'Bash']);
  assert.equal(calls[1].extra.kind, 'execute');
  assert.equal(calls[1].extra.result.is_error, false);
  assert.match(t.final_message, /didn't approve or merge/);
  const spec = [{ type: 'not-executed', params: { command: 'gh pr (review[^\n]*--approve|merge)' } }];
  assert.equal(grade(t, spec)[0].passed, true);
});

test('arm@/cmd: the entry command is split off the arm and returned', async () => {
  const { buildArm } = await import('../src/arms.mjs');
  const { mkdtempSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const out = join(mkdtempSync(join(tmpdir(), 'pw-arm-')), 'a');
  const r = buildArm('vanilla@/qm', { subject: '.', repoRoot: '.', out, pluginName: 't' });
  assert.equal(r.entry, '/qm');
  assert.equal(buildArm('vanilla', { subject: '.', repoRoot: '.', out, pluginName: 't' }).entry, null);
});
