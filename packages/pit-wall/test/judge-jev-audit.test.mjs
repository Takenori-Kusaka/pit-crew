// Second-lineage audit plumbing (plan 34 §9 instrument 8): excerpt without result bodies,
// windows within the context limit, answers -> levels, the cost ledger with a hard stop, dry run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { audit, BudgetStop, buildRequests, callLines, charge, combine, estimateTokens, ITEMS, ping, QUESTION_TOKENS, readLedger, recordLines, reserve, usd, verdict, windows } from '../src/graders/process/judge/jev-audit.mjs';
import { rec } from './process-helpers.mjs';

const ledgerFile = () => join(mkdtempSync(join(tmpdir(), 'pw-jev-')), 'jev-ledger.json');
const SECRET_BODY = 'RESULT-BODY-SHOULD-NOT-LEAVE';
const traj = (n = 6) => rec([
  ['Read', { file_path: '/app/src/lib/a.ts' }, SECRET_BODY],
  ['Grep', { pattern: 'price', path: 'src', output_mode: 'content' }, SECRET_BODY],
  ['Bash', 'npx vitest run tests/unit/a.test.ts', `Exit code 1\n${SECRET_BODY}`],
  ...Array.from({ length: n }, (_, i) => ['Bash', `echo step ${i}`, 'x']),
  ['Edit', { file_path: '/app/src/lib/a.ts', old_string: 'a', new_string: 'b' }, 'ok'],
]).trajectory;

test('the excerpt is the order of calls: number, tool, command or path, exit code; no result body', () => {
  const ls = callLines(traj(1));
  assert.deepEqual(ls.map((l) => l.text), [
    '#1 Read /app/src/lib/a.ts -> exit 0',
    '#2 Grep pattern=price path=src mode=content -> exit 0',
    '#3 Bash $ npx vitest run tests/unit/a.test.ts -> exit 1',
    '#4 Bash $ echo step 0 -> exit 0',
    '#5 Edit /app/src/lib/a.ts -> exit 0']);
  assert.equal(JSON.stringify(ls).includes(SECRET_BODY), false);
  const rl = recordLines([{ tool: 'vitest', argv: ['v', 'run', 'x.test.ts'], cwd: '/app', ended: true, exit: 1, startSrcTree: 'abcdef0123456789', tests: { summary: { failed: 2 }, files: [{ file: 'x.test.ts', status: 'failed' }] } }, { tool: 'tsc', argv: ['t'], cwd: '/app', ended: false }], { finalSrcTree: 'abcdef0123456789', callOf: (r) => (r.tool === 'vitest' ? 3 : null) });
  assert.equal(rl[0].text, 'run 1: vitest args=[run x.test.ts] cwd=/app exit=1 source-tree=abcdef0123 (= final) tests-failed=2 files: x.test.ts:failed');
  assert.equal(rl[0].call, 3);
  assert.match(rl[1].text, /exit=none \(killed or timed out\)/);
});

test('windows keep consecutive calls, fit the budget, and cut a single oversized line', () => {
  const lines = Array.from({ length: 100 }, (_, i) => ({ n: i + 1, text: `#${i + 1} Bash $ ${'x'.repeat(180)}` }));
  const ws = windows(lines, { header: 'H\n', budget: 1000 });
  assert.ok(ws.length > 5);
  assert.ok(ws.every((w) => estimateTokens(w.text) <= 1000));
  assert.equal(ws[0].first, 1);
  assert.equal(ws.at(-1).last, 100);
  for (let i = 1; i < ws.length; i++) assert.equal(ws[i].first, ws[i - 1].last + 1); // nothing lost, nothing twice
  const big = windows([{ n: 1, text: `#1 ${'y'.repeat(10000)}` }], { header: '', budget: 500 });
  assert.equal(big[0].cut, true);
  assert.ok(estimateTokens(big[0].text) <= 500);
});

test('answers: thresholds with an undecidable middle; windows combined by "true somewhere"', () => {
  assert.deepEqual([verdict(0.9), verdict(0.7), verdict(0.5), verdict(0.3), verdict(0.1), verdict(undefined)], [true, true, null, false, false, null]);
  assert.equal(combine([false, true, null]), true);
  assert.equal(combine([false, false]), false);
  assert.equal(combine([false, null]), null);
  assert.equal(combine([]), false);
});

test('levels: every item maps its answers to 0..max, and to null when an answer it needs is undecidable', () => {
  const L = (item, a) => ITEMS[item].level(a);
  assert.deepEqual([L('R1', { any: false, all: false }), L('R1', { any: true, all: false }), L('R1', { any: true, all: true }), L('R1', { any: null, all: true }), L('R1', { any: true, all: null })], [0, 1, 2, null, null]);
  assert.deepEqual([L('R2', { any: false, enough: null }), L('R2', { any: true, enough: false }), L('R2', { any: true, enough: true })], [0, 1, 2]);
  assert.deepEqual([L('R3', { search: true }), L('R3', { search: false }), L('R4', { history: true })], [1, 0, 1]);
  assert.deepEqual([L('R5', { redEarlier: true, redSame: null }), L('R5', { redEarlier: false, redSame: true }), L('R5', { redEarlier: false, redSame: false })], [2, 1, 0]);
  assert.deepEqual([L('W1', { wrote: false, first: null }), L('W1', { wrote: true, first: false }), L('W1', { wrote: true, first: true })], [0, 1, 2]);
  assert.deepEqual([L('W2', { red: true, ran: null }), L('W2', { red: false, ran: true }), L('W2', { red: false, ran: false })], [2, 1, 0]);
  assert.deepEqual([L('E1', { final: true, any: null }), L('E1', { final: false, any: true }), L('E1', { final: false, any: false })], [2, 1, 0]);
  assert.deepEqual([L('E2', { types: true, lint: true }), L('E2', { types: true, lint: false }), L('E2', { types: false, lint: false }), L('E2', { types: null, lint: true })], [2, 1, 0, null]);
  for (const [id, def] of Object.entries(ITEMS)) for (const s of Object.values(def.questions({ cutoff: 5, callersNeeded: 3 }))) { assert.equal(s.q.type, 'noul', id); assert.ok(s.q.criteria.true && s.q.criteria.false, id); }
  assert.equal(Object.keys(ITEMS).length, 9); // the 8 graded items and R4
});

const trialOf = (trajectory, cutoff, extra = {}) => ({ id: 't1', facts: { cutoff, implFiles: ['src/lib/a.ts'], callers: ['src/lib/q.ts'], callersNeeded: 1, relatedTests: ['tests/unit/a.test.ts'] }, excerpt: { calls: callLines(trajectory), runs: recordLines([{ tool: 'vitest', argv: ['v', 'run', 'tests/unit/a.test.ts'], cwd: '/app', ended: true, exit: 1, startSrcTree: 'aaaa' }], { callOf: () => 3 }) }, ...extra });
// A stand-in for Jev that reads the excerpt it was sent: "yes" when the evidence line is in it.
const reader = (evidence, log = []) => async (state, questions) => {
  const [qid] = Object.keys(questions);
  log.push({ qid, tokens: estimateTokens(JSON.stringify({ state, questions })), state });
  return { answers: { [qid]: { type: 'noul', noul: evidence(qid, state.excerpt) ? 0.95 : 0.05 } }, usage: { input_tokens: 1000 } };
};

test('requests: one question each, within the limit; windows at or after the cutoff are not asked', () => {
  const t = trialOf(traj(300), 304);
  const { requests } = buildRequests(t, { budget: 600 });
  assert.ok(requests.length > 20);
  assert.ok(requests.every((r) => Object.keys(r.questions).length === 1 && r.tokens <= QUESTION_TOKENS));
  assert.equal(JSON.stringify(requests).includes(SECRET_BODY), false);
  const one = buildRequests(trialOf(traj(300), 2), { items: ['R3'], budget: 600 }).requests;
  assert.equal(one.length, 1); // cutoff at call 2: only the first window can hold a call before it
  assert.deepEqual(buildRequests(trialOf(traj(1), null), { items: ['R3'] }).skipped, [{ item: 'R3', qid: 'search', why: 'no cutoff' }]);
  assert.deepEqual(buildRequests({ ...t, facts: { ...t.facts, callers: [] } }, { items: ['R2'] }).skipped, [{ item: 'R2', why: 'not applicable' }]);
});

test('cutting does not change the answer: evidence in the first window, at a boundary, in the last, or nowhere', async () => {
  const many = traj(300), cutoff = 304;
  const whole = async (ev) => (await audit([trialOf(many, cutoff)], { ledger: ledgerFile(), items: ['R3'], send: reader(ev), budget: 1e9 })).rows[0];
  const cut = async (ev) => (await audit([trialOf(many, cutoff)], { ledger: ledgerFile(), items: ['R3'], send: reader(ev), budget: 400 })).rows[0];
  const lines = callLines(many);
  const ws = windows(lines, { header: 'Tool calls of one session, in order.\n', budget: 400 });
  assert.ok(ws.length > 10);
  const cases = { first: '#2 Grep', boundaryEnd: `#${ws[3].last} Bash`, boundaryStart: `#${ws[4].first} Bash`, last: `#${cutoff - 1} Bash`, nowhere: '#9999 Grep' };
  for (const [name, needle] of Object.entries(cases)) {
    const ev = (qid, excerpt) => excerpt.split('\n').some((l) => l.startsWith(needle));
    const a = await whole(ev), b = await cut(ev);
    assert.equal(b.level, a.level, name);
    assert.equal(a.level, name === 'nowhere' ? 0 : 1, name);
  }
  // A count over files needs one window: asked whole it is answered, cut it is undecidable (reported, not guessed).
  const r2 = await audit([trialOf(many, cutoff)], { ledger: ledgerFile(), items: ['R2'], send: reader(() => true), budget: 400 });
  assert.deepEqual([r2.rows[0].level, r2.rows[0].undecidable], [null, true]);
  assert.equal(r2.skipped[0].why, 'needs one window');
});

test('dry run makes no call and returns the estimate', async () => {
  let calls = 0;
  const r = await audit([trialOf(traj(10), 14)], { dryRun: true, send: async () => { calls++; return {}; }, fetchImpl: () => { calls++; } });
  assert.equal(calls, 0);
  assert.equal(r.dryRun, true);
  assert.ok(r.cost.requests >= 14 && r.cost.estimatedTokens > 0 && r.cost.estimatedUsd > 0);
  assert.deepEqual(r.rows, []);
});

test('the ledger holds amounts only, and a batch that would pass the limit is not sent', async () => {
  const file = ledgerFile();
  assert.equal(readLedger(file).total_usd, 0);
  charge(file, { purpose: 'G1', requests: 400, inputTokens: 47_000_000 }); // 1.974 USD
  assert.equal(readLedger(file).total_usd, 1.974);
  assert.equal(reserve(file, 100_000, 'small').after < 2, true);
  assert.throws(() => reserve(file, 1_000_000, 'big'), BudgetStop); // +0.042 -> 2.016
  let calls = 0;
  const t = { ...trialOf(traj(10), 14) };
  // Make the estimate large enough to cross the limit: many trials.
  const trials = Array.from({ length: 4000 }, (_, i) => ({ ...t, id: `t${i}` }));
  await assert.rejects(() => audit(trials, { ledger: file, send: async () => { calls++; return {}; } }), (e) => e instanceof BudgetStop && /not sent/.test(e.message));
  assert.equal(calls, 0);
  assert.equal(readLedger(file).entries.length, 1); // nothing charged for the refused batch
  // Within the limit: sent, and the real usage is entered.
  const ok = await audit([t], { ledger: file, items: ['R3', 'E2'], send: reader(() => true) });
  assert.equal(ok.rows.find((r) => r.item === 'E2').level, 2);
  const l = readLedger(file);
  assert.equal(l.entries.at(-1).input_tokens, 3000); // 3 requests x the reported 1000
  assert.equal(l.total_usd, Number((1.974 + usd(3000)).toFixed(6)));
  const text = readFileSync(file, 'utf8');
  assert.equal(/Bearer|sk-|excerpt|src\/lib/.test(text), false); // amounts only
  await assert.rejects(() => audit([t], { send: reader(() => true) }), /ledger file is required/);
});

test('a failed request is undecidable for that question, and is still charged by estimate', async () => {
  const file = ledgerFile();
  const r = await audit([trialOf(traj(2), 6)], { ledger: file, items: ['R3'], send: async () => { throw new Error('typesafe 500'); } });
  assert.deepEqual([r.rows[0].level, r.rows[0].undecidable], [null, true]);
  const l = readLedger(file);
  assert.equal(l.entries[0].tokens_estimated, true);
  assert.ok(l.entries[0].input_tokens > 0);
});

test('connectivity check: one request, entered in the ledger', async () => {
  const file = ledgerFile();
  const log = [];
  const r = await ping({ ledger: file, send: async (state, questions) => { log.push(1); return { answers: { p: { type: 'noul', noul: 0.99 } }, usage: { input_tokens: 41 } }; } });
  assert.deepEqual([r.ok, r.answer, r.inputTokens, log.length], [true, true, 41, 1]);
  assert.equal(readLedger(file).requests, 1);
  assert.ok(readLedger(file).total_usd < 0.00001);
});
