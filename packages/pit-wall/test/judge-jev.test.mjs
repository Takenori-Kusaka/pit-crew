// Deterministic parts of the Jev reader: question shape (criteria per choice), probability-based
// rate, Δ against the control, no key ever placed in the request body. The API is faked.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readerQuestion, measurePointJev, pickFromAnswer } from '../src/graders/process/judge/jev.mjs';

const OPTS = [{ text: 'reuse the helper' }, { text: 'write a new helper' }, { text: 'inline the logic' }];

test('readerQuestion: one criteria entry per shuffled label; the adopted option is not marked', () => {
  const { questions, labelOf, adoptedLabel, state } = readerQuestion(OPTS, 1, 'because the helper already exists', 3);
  assert.deepEqual(Object.keys(questions.pick.criteria).sort(), [...questions.pick.choices].sort());
  assert.equal(questions.pick.choices.length, 3);
  assert.equal(adoptedLabel, labelOf[1]);
  assert.ok(!state.options.some((o) => /adopt|chose|選/.test(o)));
});

test('measurePointJev: Δ = mean P(adopted | rationale) − mean P(adopted | none); the key stays in the header', async () => {
  process.env.TYPESAFE_API_KEY = 'test-key-not-real';
  const bodies = [];
  const fetchImpl = async (_url, init) => {
    const body = JSON.parse(init.body); bodies.push({ body, auth: init.headers.authorization });
    const labels = body.questions.pick.choices;
    const hasRationale = !/no reasoning available/.test(body.state.reasoning);
    // With a rationale the fake reader puts 0.9 on the label whose option text contains "new";
    // without one it is uniform.
    const probabilities = {};
    for (const l of labels) { const line = body.state.options.find((o) => o.startsWith(`${l}:`)); probabilities[l] = hasRationale ? (/new/.test(line) ? 0.9 : 0.05) : 1 / labels.length; }
    return { ok: true, json: async () => ({ answers: { pick: { type: 'choice', choice: labels[0], probabilities } }, usage: { input_tokens: 100 } }) };
  };
  const m = await measurePointJev({ options: OPTS, adoptedIndex: 1, rationale: 'the old helper is too slow', degenerate: 'write a new helper.' }, { k: 3, fetchImpl });
  assert.ok(Math.abs(m.withRationale.rate - 0.9) < 1e-9);
  assert.ok(Math.abs(m.control.rate - 1 / 3) < 1e-9);
  assert.ok(Math.abs(m.delta - (0.9 - 1 / 3)) < 1e-9);
  assert.equal(m.aboveChance, true);
  assert.equal(m.degenerateBeatsControl, true);
  assert.equal(m.inputTokens, 900);
  assert.equal(m.errors, 0);
  for (const b of bodies) { assert.equal(b.auth, 'Bearer test-key-not-real'); assert.ok(!JSON.stringify(b.body).includes('test-key-not-real')); }
  delete process.env.TYPESAFE_API_KEY;
});

test('pickFromAnswer maps the chosen label back to the option index; unknown label → null', () => {
  const { labelOf } = readerQuestion(OPTS, 0, null, 1);
  assert.equal(pickFromAnswer({ pick: { choice: labelOf[2] } }, labelOf), 2);
  assert.equal(pickFromAnswer({ pick: { choice: 'Z' } }, labelOf), null);
});
