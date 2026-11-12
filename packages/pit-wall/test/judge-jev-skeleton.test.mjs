// Jev as the second skeleton lineage: shape of the raw, threshold, single adoption, and that the
// checks accept a Jev output without quotes while still demanding them from a quoting lineage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jevSkeleton } from '../src/graders/process/judge/jev.mjs';
import { settleTargeted, targetedCheck, extractTargetedBatch } from '../src/graders/process/judge/extract.mjs';

const OPTS = [{ id: 'p0', text: 'reuse parse_date from lib/dates.sh' }, { id: 'p1', text: 'parse the date inline in bin/report' }, { id: 'p2', text: 'add a date library' }];
const TEXT = 'Option A: reuse parse_date from lib/dates.sh — same error handling as bin/export; one more source line. Option B: parse the date inline in bin/report — self-contained, but repeats the error handling. I will go with A.';
// Fake Jev: p0 mentioned+adopted, p1 mentioned, p2 absent; not trivial. Probabilities mimic real answers.
const fakeFetch = async (_url, init) => {
  const body = JSON.parse(init.body);
  let answers;
  if (body.questions.trivial) answers = { trivial: { type: 'noul', noul: 0.08 } };
  else {
    const o = body.state.option;
    const pm = /parse_date/.test(o) ? 0.93 : /inline/.test(o) ? 0.88 : 0.12;
    const pa = /parse_date/.test(o) ? 0.9 : /inline/.test(o) ? 0.75 : 0.05; // p1 adopted 0.75 → also over 0.7: tie-break keeps the max
    answers = { mentioned: { type: 'noul', noul: pm }, adopted: { type: 'noul', noul: pa } };
  }
  return { ok: true, json: async () => ({ answers, usage: { input_tokens: 50 } }) };
};

test('jevSkeleton: thresholded mentions, one adoption (max probability), trivial from its own question, tokens counted', async () => {
  process.env.TYPESAFE_API_KEY = 'test-key-not-real';
  const r = await jevSkeleton(TEXT, OPTS, { fetchImpl: fakeFetch });
  assert.equal(r.error, null);
  assert.equal(r.out.lineage, 'jev');
  assert.deepEqual(r.out.options.map((o) => [o.id, o.mentioned, o.claimed_adopted]), [['p0', true, true], ['p1', true, false], ['p2', false, false]]);
  assert.equal(r.out.trivial_claim, false);
  assert.equal(r.inputTokens, 200);
  delete process.env.TYPESAFE_API_KEY;
});

test('checks: a jev output passes without quotes; the same shape from a quoting lineage does not', () => {
  const jev = { lineage: 'jev', options: [{ id: 'p0', mentioned: true, evidence: '', claimed_adopted: true, pros: [], cons: [] }, { id: 'p1', mentioned: true, evidence: '', claimed_adopted: false, pros: [], cons: [] }, { id: 'p2', mentioned: false, evidence: '', claimed_adopted: false, pros: [], cons: [] }], other_options: [], trivial_claim: false };
  assert.equal(targetedCheck(TEXT, OPTS, jev, { requireEvidence: false }).ok, true);
  assert.equal(targetedCheck(TEXT, OPTS, { ...jev, lineage: undefined }).ok, false);
  const qwen = { options: [
    { id: 'p0', mentioned: true, evidence: 'reuse parse_date from lib/dates.sh', claimed_adopted: true, pros: ['same error handling as bin/export'], cons: ['one more source line'] },
    { id: 'p1', mentioned: true, evidence: 'parse the date inline in bin/report', claimed_adopted: false, pros: ['self-contained'], cons: [] },
    { id: 'p2', mentioned: false, evidence: '', claimed_adopted: false, pros: [], cons: [] }], other_options: [], trivial_claim: false };
  const s = settleTargeted(TEXT, OPTS, [qwen, jev]);
  assert.equal(s.status, 'ok');
  assert.deepEqual(s.out.options.find((o) => o.id === 'p0').pros, ['same error handling as bin/export']); // reasons come from the quoting lineage
  const jevFlipped = { ...jev, options: jev.options.map((o) => (o.id === 'p2' ? { ...o, mentioned: true } : o)) };
  assert.equal(settleTargeted(TEXT, OPTS, [qwen, jevFlipped]).reason, 'lineages disagree on the skeleton');
});

test('extractTargetedBatch: a caller replaces the ollama call for its lineage and its raw is cached under that name', async () => {
  process.env.TYPESAFE_API_KEY = 'test-key-not-real';
  const cache = {}; let ollamaCalls = 0;
  const callers = { jev: (text, options) => jevSkeleton(text, options, { fetchImpl: fakeFetch }) };
  const items = [{ text: TEXT, options: OPTS }];
  const b = await extractTargetedBatch(['jev'], items, { cache, callers, fetchImpl: async () => { ollamaCalls++; throw new Error('no ollama'); } });
  assert.equal(ollamaCalls, 0);
  assert.ok(Object.keys(cache)[0].startsWith('jev:T2:'));
  assert.equal(b.get(items[0]).status, 'abstain'); // one lineage only
  assert.equal(b.get(items[0]).raws[0].out.lineage, 'jev');
  delete process.env.TYPESAFE_API_KEY;
});
