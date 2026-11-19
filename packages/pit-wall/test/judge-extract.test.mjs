// Deterministic parts of the format-independent extractor (no model): quote / count checks,
// canonical agreement, and the renderings used as the invariance oracle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteCheck, countCheck, canonical, agree, settleExtraction, renderAs, RENDERINGS } from '../src/graders/process/judge/extract.mjs';

const S = { decision: 'how to parse --since', options: [
  { text: 'reuse parse_date from lib/dates.sh', adopted: true, pros: ['same error handling as bin/export'], cons: ['one more source line'] },
  { text: 'parse the date inline in bin/report', adopted: false, pros: ['self-contained'], cons: ['repeats the error handling'] },
] };

test('quoteCheck: phrases copied from the source pass; a paraphrase is reported missing', () => {
  const text = renderAs(S, 'bullets', 'en');
  assert.equal(quoteCheck(text, S).ok, true);
  const bad = { ...S, options: [{ ...S.options[0], pros: ['identical error handling'] }, S.options[1]] };
  assert.deepEqual(quoteCheck(text, bad).missing, ['identical error handling']);
});

test('countCheck: exactly one adopted option; a trivial claim with two options is inconsistent', () => {
  assert.equal(countCheck(S).ok, true);
  assert.deepEqual(countCheck({ ...S, options: S.options.map((o) => ({ ...o, adopted: false })) }).problems, ['0 adopted options']);
  assert.deepEqual(countCheck({ ...S, trivial_claim: true }).problems, ['trivial claim with two or more options']);
  assert.equal(countCheck({ options: [], trivial_claim: true }).ok, true);
});

test('canonical / agree: order, case, markup, whitespace and the option label do not matter; a changed polarity does', () => {
  const a = S;
  const b = { ...S, options: [S.options[1], { ...S.options[0], text: '**Option A**（adopted）: Reuse parse_date from `lib/dates.sh`' }] };
  assert.equal(agree(a, b), true);
  // the label alone as the option text (a table with a label column) still agrees: the option is
  // identified by its arguments and adoption
  const lbl = { ...S, options: [{ ...S.options[0], text: 'Option A' }, { ...S.options[1], text: 'Option B' }] };
  assert.equal(agree(a, lbl), true);
  const c = { ...S, options: [S.options[0], { ...S.options[1], pros: [], cons: ['self-contained', 'repeats the error handling'] }] };
  assert.equal(agree(a, c), false);
  // Japanese spacing is not a difference
  const ja = { options: [{ text: '既存の round を直す', adopted: true, pros: ['呼び出し元が 1 つ'], cons: [] }] };
  const ja2 = { options: [{ text: '案A（採用）: 既存のroundを直す', adopted: true, pros: ['呼び出し元が1つ'], cons: [] }] };
  assert.equal(agree(ja, ja2), true);
  // joined argument lists and polarity labels are not differences
  const joined = { options: [{ text: 'x', adopted: true, pros: ['良い点: callers decide the budget / failures stay visible'], cons: ['two call sites to change'] }] };
  const split = { options: [{ text: 'x', adopted: true, pros: ['callers decide the budget', 'failures stay visible'], cons: ['two call sites to change'] }] };
  assert.equal(agree(joined, split), true);
  // a trivial declaration with one pseudo-option equals one with none
  assert.equal(agree({ options: [{ text: 'none', adopted: true, pros: [], cons: [] }], trivial_claim: true }, { options: [], trivial_claim: true }), true);
  assert.ok(canonical(a).includes('"adopted":true'));
});

test('quoteCheck: an option text with a label prefix, or a whole source sentence, passes once the label is stripped', () => {
  const text = renderAs(S, 'bullets', 'en');
  const labelled = { ...S, options: [{ ...S.options[0], text: 'Option A（adopted）: reuse parse_date from lib/dates.sh' }, S.options[1]] };
  assert.equal(quoteCheck(text, labelled).ok, true);
  const prose = renderAs(S, 'prose', 'ja');
  const sentence = { ...S, options: [{ ...S.options[0], text: '案Aは「reuse parse_date from lib/dates.sh」で、良い点はsame error handling as bin/export。悪い点はone more source line。これを採用した。' }, S.options[1]] };
  assert.equal(quoteCheck(prose, sentence).ok, true);
});

test('settleExtraction: two valid agreeing lineages -> ok; disagreement or a single valid one -> abstain', () => {
  const text = renderAs(S, 'prose', 'en');
  assert.equal(settleExtraction(text, [S, S]).status, 'ok');
  const other = { ...S, options: [{ ...S.options[0], adopted: false }, { ...S.options[1], adopted: true }] };
  assert.equal(settleExtraction(text, [S, other]).reason, 'lineages disagree');
  assert.equal(settleExtraction(text, [S, null]).reason, 'one valid extraction only');
  assert.equal(settleExtraction(text, [{ ...S, options: [{ ...S.options[0], pros: ['not in the text'] }] }, null]).reason, 'no valid extraction');
});

test('renderings: every form contains every phrase of the structure (so quoteCheck can pass on each) and they differ from each other', () => {
  const texts = RENDERINGS.map(([f, l]) => renderAs(S, f, l));
  for (const t of texts) assert.equal(quoteCheck(t, S).ok, true, t.slice(0, 80));
  assert.equal(new Set(texts).size, texts.length);
});
