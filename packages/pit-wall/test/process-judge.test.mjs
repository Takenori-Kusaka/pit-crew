// Stage 0c judge plumbing, checked both ways without calling a model: bundle normalisation,
// the quote-existence check, context-overflow invalidation, the R4 observation check and the
// majority vote.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBundle, stripFormat, neutralise, normaliseText, hideAdoption } from '../src/graders/process/judge/bundle.mjs';
import { checkQuotes, settle, majority, NUM_CTX } from '../src/graders/process/judge/jurors.mjs';
import { buildPrompt } from '../src/graders/process/judge/items.mjs';
import { cases, SCENARIOS } from '../src/graders/process/judge/validation-set.mjs';

const R4 = { item: 'R4', task: 'Fix the rounding.', observations: [{ tool: '$ grep -rn toFixed src', text: 'src/invoice.js:30:  total.toFixed(2)' }], authored: 'I used roundCents because src/invoice.js:30 rounds with toFixed(2).' };

test('stripFormat removes headings, bold, list marks, checkboxes, emoji, fences, tables; keeps words', () => {
  const t = stripFormat('## Decision 📌\n- **Use** `memoize()` ✅\n1. [x] second\n```js\nconst a = 1;\n```\n| A | B |\n|---|---|\n| x | y |');
  assert.equal(t, 'Decision\nUse memoize()\nsecond\nconst a = 1;\nA; B\nx; y');
  // Identifiers with underscores and plain sentences survive.
  assert.equal(stripFormat('call parse_date on $since'), 'call parse_date on $since');
});

test('neutralise replaces arm words, rule ids and note paths; drops template and origin lines; keeps content', () => {
  const t = neutralise('Rationale (rule R4)\nWritten by Claude:\nPer the process, see notes/decision-003.md and ADR-0057.\nThe grep shows 3 callers.');
  assert.ok(!/R4|ADR|notes\/|Claude|Rationale/.test(t), t);
  assert.match(t, /The grep shows 3 callers\./);
  assert.match(t, /\[note\]/);
  // Adopted / rejected words carry meaning for R5 and stay.
  assert.match(neutralise('Rejected — parse at startup: 14 files'), /^Rejected/);
});

test('harness and plain renderings of the same substance normalise to nearly the same words', () => {
  const words = (s) => new Set(normaliseText(s).toLowerCase().match(/[a-z0-9_.()]+/g));
  for (const s of SCENARIOS.filter((x) => x.item !== 'R2')) {
    const p = words(s.good.plain), h = words(s.good.harness);
    const shared = [...h].filter((w) => p.has(w)).length;
    assert.ok(shared / h.size >= 0.6, `${s.id}: ${shared}/${h.size}`);
  }
});

test('R2 bundle hides which option was adopted and does not keep the written order', () => {
  const b = buildBundle({ id: 'x', item: 'R2', task: 't', observations: [], options: ['**Option A (adopted):** reuse lib/x', '案 B（却下）\nwrite a new one', 'We chose the third. Do nothing'] });
  const text = b.spans.filter((s) => s.kind === 'option').map((s) => s.text).join('\n');
  assert.ok(!/adopted|chosen|却下|採用|Option A|案 B/i.test(text), text);
  assert.equal(hideAdoption('Option 1 (chosen): wrap it'), 'Option 1 : wrap it');
  assert.equal(b.spans.filter((s) => s.kind === 'option').length, 3);
});

test('bundle is deterministic and a pure-format change leaves the hash unchanged', () => {
  const a = buildBundle({ ...R4, authored: 'I used roundCents because src/invoice.js:30 rounds with toFixed(2).' });
  const b = buildBundle({ ...R4, authored: '## Summary\n\n**I used `roundCents`** because src/invoice.js:30 rounds with toFixed(2). ✅' });
  assert.equal(a.hash, b.hash);
  const c = buildBundle({ ...R4, authored: 'I used roundCents because it is cleaner.' });
  assert.notEqual(a.hash, c.hash);
});

test('quote check: verbatim quotes pass (whitespace and ellipsis tolerated), invented ones fail', () => {
  const b = buildBundle(R4);
  assert.ok(checkQuotes(b, [{ span_id: 'O1', text: 'src/invoice.js:30:   total.toFixed(2)' }]).ok);
  assert.ok(checkQuotes(b, [{ span_id: 'A1', text: '"I used roundCents ... toFixed(2)."' }]).ok);
  const bad = checkQuotes(b, [{ span_id: 'O1', text: 'invoice.js calls roundCents in four places' }]);
  assert.equal(bad.ok, false);
  assert.equal(bad.missing.length, 1);
  // Wrong span id but present elsewhere: relocated to the real span.
  const moved = checkQuotes(b, [{ span_id: 'A1', text: 'total.toFixed(2)' }]);
  assert.ok(moved.ok);
  assert.equal(moved.located[0].span_id, 'O1');
});

test('settle: a verdict with a missing quote is invalid; with real quotes it stands', () => {
  const b = buildBundle(R4);
  const good = settle(b, { out: { quotes: [{ span_id: 'A1', text: 'I used roundCents' }, { span_id: 'O1', text: 'total.toFixed(2)' }], reasoning: 'r', verdict: 'met' } });
  assert.deepEqual([good.valid, good.verdict], [true, 'met']);
  const fake = settle(b, { out: { quotes: [{ span_id: 'O1', text: 'grep shows 4 callers' }], reasoning: 'r', verdict: 'met' } });
  assert.deepEqual([fake.valid, fake.invalid], [false, 'quote-missing']);
  assert.equal(settle(b, { out: null, error: 'boom' }).invalid, 'error');
});

test('settle: R4 met without a tool-output quote is downgraded to not-met; with one it stays met', () => {
  const b = buildBundle(R4);
  const onlyClaim = settle(b, { out: { quotes: [{ span_id: 'A1', text: 'I used roundCents' }], reasoning: 'r', verdict: 'met' } });
  assert.deepEqual([onlyClaim.valid, onlyClaim.verdict], [true, 'not-met']);
  assert.match(onlyClaim.note, /downgraded/);
  // not-met is never upgraded.
  assert.equal(settle(b, { out: { quotes: [], reasoning: 'r', verdict: 'not-met' } }).verdict, 'not-met');
});

test('settle: prompt tokens above 80 % of num_ctx invalidate the verdict; below they do not', () => {
  const b = buildBundle(R4);
  const out = { quotes: [], reasoning: 'r', verdict: 'not-met' };
  assert.equal(settle(b, { out, promptTokens: Math.ceil(0.8 * NUM_CTX) + 1, numCtx: NUM_CTX }).invalid, 'context-overflow');
  assert.equal(settle(b, { out, promptTokens: 3998, numCtx: 4096 }).invalid, 'context-overflow'); // the granite probe of planning 23 §8
  assert.equal(settle(b, { out, promptTokens: 1200, numCtx: NUM_CTX }).valid, true);
  // The character estimate catches a prompt the server under-reports (prompt cache reuse).
  assert.equal(settle(b, { out, promptTokens: 50, estTokens: 7000, numCtx: NUM_CTX }).invalid, 'context-overflow');
  // Claude (no numCtx) is not subject to the check.
  assert.equal(settle(b, { out, promptTokens: 9999 }).valid, true);
});

test('majority: 2 of 3 decides either way; invalid jurors abstain; splits are flagged', () => {
  const v = (verdict, valid = true) => ({ verdict, valid });
  assert.deepEqual(majority([v('met'), v('met'), v('not-met')]), { verdict: 'met', met: 2, notMet: 1, invalid: 0, split: true, noMajority: false });
  assert.equal(majority([v('not-met'), v('not-met'), v('met')]).verdict, 'not-met');
  assert.equal(majority([v('met'), v('met'), v('met')]).split, false);
  const abst = majority([v('met'), v('not-met'), v(null, false)]);
  assert.deepEqual([abst.verdict, abst.noMajority, abst.split], [null, true, true]);
  assert.equal(majority([v('met'), v('met'), v(null, false)]).verdict, 'met');
  assert.equal(majority([v(null, false), v(null, false), v('met')]).verdict, null);
});

test('validation set: every bad version differs from its good version, every item has 3 pairs and 9 perturbation kinds', () => {
  const all = cases();
  for (const item of ['R2', 'R4', 'R5', 'S2']) {
    const base = all.filter((c) => c.item === item && c.set === 'base');
    assert.equal(base.filter((c) => c.label === 'met').length, 3, item);
    assert.equal(base.filter((c) => c.label === 'not-met').length, 3, item);
    for (const g of base.filter((c) => c.label === 'met')) {
      const bad = base.find((c) => c.scenario === g.scenario && c.label === 'not-met');
      assert.notEqual(buildBundle(g).hash, buildBundle(bad).hash, g.id);
    }
    const kinds = new Set(all.filter((c) => c.item === item && c.set === 'perturbation').map((c) => c.perturbation));
    kinds.add('arm-fairness');
    assert.ok(kinds.size >= (item === 'S2' ? 8 : 9), `${item}: ${[...kinds]}`);
    assert.equal(all.filter((c) => c.item === item && c.set === 'arm-fairness').length, 6);
  }
  // Prompts stay far below the context limit.
  for (const c of all) assert.ok(buildPrompt(buildBundle(c)).length / 3.2 < 0.5 * NUM_CTX, c.id);
});
