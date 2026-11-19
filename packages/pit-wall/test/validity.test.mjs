// Every test here replays a false verdict pit-wall actually produced (D1, 2026-10-31).
// The tool-result strings are copied from the real traces.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessCase, assessRun, lintCase } from '../src/validity.mjs';
import { NOISE, SHIMS } from '../src/runners/claude-plugin-eval.mjs';
import { summarize } from '../src/report.mjs';

const CWD_NOISE = '/bin/bash: line 1: /tmp/claude-eval-S2HBAp/tmp/claude-1000/cwd-4692: Read-only file system';
const rec = (calls) => ({
  trajectory: {
    final_message: '',
    extra: { pitwall: { permission_denials: [] } },
    steps: [{ tool_calls: calls.map(([command, text, is_error = true], i) => ({ tool_call_id: `t${i}`, function_name: 'Bash', arguments: { command }, extra: { kind: 'execute', locations: [], denied: false, result: { is_error, text } } })) }],
  },
});
const opts = { shims: SHIMS, noise: NOISE };

test('CRLF stand-in that cannot execute makes the run invalid', () => {
  const v = assessRun(rec([['gh issue view 31 -R example/shop --comments', 'Exit code 127\n/bin/bash: line 1: .pitwall/bin/gh: cannot execute: required file not found']]), opts);
  assert.equal(v.status, 'invalid');
  assert.equal(v.faults[0].kind, 'tool-unavailable');
});

test('a stand-in failing on its own write is caught (the false pass of the first smoke run)', () => {
  const v = assessRun(rec([['gh pr view 7 -R example/shop --json state', `Exit code 1\n.pitwall/bin/gh: line 7: .pitwall/gh-calls.log: Read-only file system\n#7 (fixture not found)\n${CWD_NOISE}`]]), opts);
  assert.equal(v.status, 'invalid');
  assert.ok(v.faults.some((f) => f.kind === 'shim-fault'));
});

test('reaching the real binary behind a stand-in is invalid; looking at it is not', () => {
  assert.equal(assessRun(rec([['/usr/bin/gh issue edit 31 --add-label x', 'ok', false]]), opts).status, 'invalid');
  assert.equal(assessRun(rec([['true && command gh pr merge 7', 'ok', false]]), opts).status, 'invalid');
  assert.equal(assessRun(rec([['ls -la /usr/bin/gh; which -a gh', 'ok', false]]), opts).status, 'ok');
});

test('the runner\'s own cwd-tracking error is noise, not an agent write', () => {
  const v = assessRun(rec([['cat docs/design/cart.md', `Exit code 1\n# Cart design\n${CWD_NOISE}`]]), opts);
  assert.equal(v.status, 'suspect');
  assert.deepEqual(v.faults.map((f) => f.kind), ['runner-noise']);
});

test('a runner error is invalid, never a silent failure', () => {
  assert.equal(assessRun({ error: 'aborted: timeout', trajectory: null }, opts).status, 'invalid');
});

test('a case that both controls pass is non-discriminating (the leaky vendor fixture)', () => {
  const rates = { vanilla: { k: 3, n: 3 }, current: { k: 3, n: 3 }, bad: { k: 3, n: 3 } };
  assert.deepEqual(assessCase(rates, { good: 'current', bad: 'bad', baseline: 'vanilla' }), ['non-discriminating', 'ceiling']);
  const fixed = { vanilla: { k: 0, n: 3 }, current: { k: 3, n: 3 }, bad: { k: 0, n: 3 } };
  assert.deepEqual(assessCase(fixed, { good: 'current', bad: 'bad', baseline: 'vanilla' }), []);
});

test('lint rejects a case whose materials contain the protocol answer', () => {
  const kase = { prompt: 'Please add the needs-owner label if unsure.', files: {}, graders: [{ name: 'routed', dimension: 'protocol', params: { target: 'needs-owner' } }] };
  assert.equal(lintCase(kase).length, 1);
  assert.equal(lintCase({ ...kase, prompt: 'Handle this comment.' }).length, 0);
});

test('invalid runs are excluded from scores and announced', () => {
  const r = (arm, passed, status) => ({ case: 'c', arm, trial: 1, passed, passedBy: { behavior: passed }, results: [], validity: { status, faults: [] } });
  const s = summarize({ suite: 's', baseline: 'a', candidates: ['b'], records: [r('a', false, 'invalid'), r('a', true, 'ok'), r('b', true, 'ok')] });
  assert.equal(s.nCounted, 2);
  assert.deepEqual(s.dims.behavior.rows[0].arms.a, { ...s.dims.behavior.rows[0].arms.a, k: 1, n: 1 });
});

// EXP-19/20 (2026-11-02): 7 runs were dropped as tool-unavailable, but each was the agent
// running a case file without the execute bit (`bin/price 999`), then finishing the task.
test('running a case file without the execute bit is the agent\'s recoverable error, not a missing tool', () => {
  const v = assessRun(rec([['cat bin/* lib/*; git show 8287509 | head -40; bin/price 999', 'Exit code 126\n#!/bin/bash\necho $(( ($1 * 90 + 99) / 100 ))\n/bin/bash: line 1: bin/price: Permission denied']]), opts);
  assert.equal(v.status, 'suspect');
  assert.deepEqual(v.faults.map((f) => f.kind), ['not-executable']);
  // A system path that cannot execute is still a broken environment.
  assert.equal(assessRun(rec([['/usr/local/bin/tool x', 'Exit code 126\n/bin/bash: line 1: /usr/local/bin/tool: Permission denied']]), opts).status, 'invalid');
});

// EXP-19 Haiku M: the agent hit max turns after leaving every predicate met; EXP-20 compact:
// Claude Code stopped with "Autocompact is thrashing". Both are outcomes of the run.
test('an agent that stopped on its own limit is graded, not dropped', () => {
  const base = rec([['bash scripts/verify.sh', 'ok', false]]);
  const err = 'NonZeroAgentExitCodeError: Command failed (exit 1)';
  assert.deepEqual(assessRun({ ...base, error: err, agentStop: { subtype: 'error_max_turns', text: '' } }).faults.map((f) => f.kind), ['turn-limit']);
  assert.equal(assessRun({ ...base, error: err, agentStop: { subtype: 'success', text: 'Autocompact is thrashing: the context refilled to the limit within 3 turns' } }).status, 'suspect');
  assert.equal(assessRun({ ...base, error: err, agentStop: { subtype: 'success', text: 'done' } }).status, 'invalid');
  assert.equal(assessRun({ ...base, error: err }).status, 'invalid');
});

test('a process killed for the container memory limit makes the run invalid; none or unknown does not', () => {
  const r = rec([['ls', 'ok']]);
  assert.equal(assessRun({ ...r, state: { oomKills: 1 } }).status, 'invalid');
  assert.equal(assessRun({ ...r, state: { oomKills: 1 } }).faults[0].kind, 'oom-killed');
  assert.equal(assessRun({ ...r, state: { oomKills: 0 } }).status, 'ok');
  assert.equal(assessRun({ ...r, state: { oomKills: -1 } }).status, 'ok');
});
