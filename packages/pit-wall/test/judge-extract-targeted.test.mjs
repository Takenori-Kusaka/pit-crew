// Deterministic parts of targeted extraction: checks, skeleton agreement, merging of reasons.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { targetedCheck, targetedSkeleton, settleTargeted, buildTargetedPrompt } from '../src/graders/process/judge/extract.mjs';

const OPTS = [{ id: 'p0', text: 'reuse parse_date from lib/dates.sh' }, { id: 'p1', text: 'parse the date inline in bin/report' }, { id: 'p2', text: 'add a date library' }];
const TEXT = 'Option A: reuse parse_date from lib/dates.sh — same error handling as bin/export; one more source line. Option B: parse the date inline in bin/report — self-contained, but repeats the error handling. I will go with A.';
const good = { options: [
  { id: 'p0', mentioned: true, evidence: 'reuse parse_date from lib/dates.sh', claimed_adopted: true, pros: ['same error handling as bin/export'], cons: ['one more source line'] },
  { id: 'p1', mentioned: true, evidence: 'parse the date inline in bin/report', claimed_adopted: false, pros: ['self-contained'], cons: ['repeats the error handling'] },
  { id: 'p2', mentioned: false, evidence: '', claimed_adopted: false, pros: [], cons: [] },
], other_options: [], trivial_claim: false };

test('a mention needs verifiable evidence: an invented span fails unless a verified reason backs the mention', () => {
  // p2 is absent from the notes; claiming it with a made-up span is invalid (the 2026-11-05 failure mode).
  const hallucinated = { ...good, options: [good.options[0], good.options[1], { ...good.options[2], mentioned: true, evidence: 'we also weighed adding a date library' }] };
  assert.ok(targetedCheck(TEXT, OPTS, hallucinated).problems.includes('p2: mention without verifiable evidence'));
  // A mention whose evidence span is paraphrased but whose reason is verbatim still passes (the reason is the evidence).
  const paraphrasedSpan = { ...good, options: [{ ...good.options[0], evidence: 'reusing the helper' }, good.options[1], good.options[2]] };
  assert.equal(targetedCheck(TEXT, OPTS, paraphrasedSpan).ok, true);
  // Mention with neither span nor reason: invalid.
  const bare = { ...good, options: [good.options[0], { ...good.options[1], evidence: '', pros: [], cons: [] }, good.options[2]] };
  assert.equal(targetedCheck(TEXT, OPTS, bare).ok, false);
  // A one-word span that happens to occur in the notes ("date") is too short to count as evidence.
  const tiny = { ...good, options: [good.options[0], { ...good.options[1], evidence: 'date', pros: [], cons: [] }, good.options[2]] };
  assert.equal(targetedCheck(TEXT, OPTS, tiny).ok, false);
});

test('a correct targeted extraction passes the checks; the prompt lists every planted id', () => {
  assert.equal(targetedCheck(TEXT, OPTS, good).ok, true);
  const p = buildTargetedPrompt(TEXT, OPTS);
  for (const o of OPTS) assert.ok(p.includes(`[${o.id}] ${o.text}`));
});

test('checks fail on: an invented reason, a reason for an unmentioned option, two adoptions, a missing id', () => {
  const invented = { ...good, options: [{ ...good.options[0], pros: ['battle-tested helper'] }, good.options[1], good.options[2]] };
  assert.deepEqual(targetedCheck(TEXT, OPTS, invented).missing, ['battle-tested helper']);
  const unmentioned = { ...good, options: [good.options[0], good.options[1], { ...good.options[2], cons: ['one more source line'] }] };
  assert.ok(targetedCheck(TEXT, OPTS, unmentioned).problems.some((p) => /without mention/.test(p)));
  const two = { ...good, options: [good.options[0], { ...good.options[1], claimed_adopted: true }, good.options[2]] };
  assert.ok(targetedCheck(TEXT, OPTS, two).problems.includes('more than one claimed adoption'));
  const missingId = { ...good, options: good.options.slice(0, 2) };
  assert.ok(targetedCheck(TEXT, OPTS, missingId).problems.includes('ids not answered exactly once'));
});

test('skeleton agreement ignores reasons and order; disagreement on mention or adoption abstains; reasons are merged', () => {
  const other = { ...good, options: [good.options[2], { ...good.options[1], pros: ['self-contained'], cons: [] }, { ...good.options[0], pros: [], cons: ['one more source line'] }] };
  assert.equal(targetedSkeleton(good), targetedSkeleton(other));
  const s = settleTargeted(TEXT, OPTS, [good, other]);
  assert.equal(s.status, 'ok');
  assert.deepEqual(s.out.options.find((o) => o.id === 'p0').pros, ['same error handling as bin/export']);
  const flipped = { ...good, options: [{ ...good.options[0], claimed_adopted: false }, { ...good.options[1], claimed_adopted: true }, good.options[2]] };
  assert.equal(settleTargeted(TEXT, OPTS, [good, flipped]).reason, 'lineages disagree on the skeleton');
  assert.equal(settleTargeted(TEXT, OPTS, [good, null]).reason, 'one valid extraction only');
});
