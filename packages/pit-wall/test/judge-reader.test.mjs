// Deterministic parts of the reader-model measure: shuffling, prompt hygiene, parsing, rates.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shuffled, buildReaderPrompt, parseChoice, pickRate, communicable } from '../src/graders/process/judge/reader.mjs';

const OPTS = [{ text: 'reuse parse_date (adopted)' }, { text: 'parse inline' }, { text: 'add a library' }];

test('shuffled is a permutation, reproducible per seed, and differs across seeds', () => {
  const a = shuffled(3, 1), b = shuffled(3, 1);
  assert.deepEqual(a, b);
  assert.deepEqual([...a].sort(), [0, 1, 2]);
  const diff = [1, 2, 3, 4, 5, 6].some((s) => JSON.stringify(shuffled(3, s)) !== JSON.stringify(a));
  assert.ok(diff);
});

test('the prompt carries no task, no repo and no adoption wording; labels map back to options', () => {
  const { prompt, labelOf, adoptedLabel } = buildReaderPrompt(OPTS, 0, 'Reuse keeps one error path. I chose this because the helper exists.', 7);
  assert.ok(!/adopted/i.test(prompt), prompt);
  assert.ok(!/task|repository/i.test(prompt));
  assert.equal(adoptedLabel, labelOf[0]);
  assert.equal(parseChoice({ choice: adoptedLabel }, labelOf), 0);
  assert.equal(parseChoice({ choice: `${adoptedLabel}.` }, labelOf), 0);
  assert.equal(parseChoice({ choice: 'Z' }, labelOf), null);
  // control prompt has no reasoning block
  assert.ok(/No reasoning is available/.test(buildReaderPrompt(OPTS, 0, null, 7).prompt));
});

test('pickRate and communicable Δ, both directions', () => {
  assert.deepEqual(pickRate([0, 0, 1, null], 0), { rate: 2 / 3, n: 3, invalid: 1 });
  const good = communicable({ withRationale: { rate: 1 }, control: { rate: 1 / 3 }, degenerate: { rate: 1 / 3 } }, 3);
  assert.ok(good.delta > 0.6 && good.aboveChance && !good.degenerateBeatsControl);
  const useless = communicable({ withRationale: { rate: 1 / 3 }, control: { rate: 1 / 3 }, degenerate: null }, 3);
  assert.equal(useless.delta, 0); assert.equal(useless.aboveChance, false); assert.equal(useless.degenerateBeatsControl, null);
});
