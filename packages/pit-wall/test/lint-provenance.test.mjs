// Provenance lint (warnings): missing block, bad vocabulary, and the forbidden truth 'agent-answer'.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintProvenance } from '../src/validity.mjs';

test('a complete provenance passes; a missing one warns once', () => {
  assert.deepEqual(lintProvenance({ provenance: { source: 'incident', ref: 'I-14', candidate: 'yes', truth: 'reference-script' } }), []);
  assert.equal(lintProvenance({}).length, 1);
});

test('vocabulary and the agent-answer truth are flagged', () => {
  const w = lintProvenance({ provenance: { source: 'dream', truth: 'agent-answer', candidate: 'no', reason: 'meh' } });
  assert.ok(w.some((x) => /source "dream"/.test(x)));
  assert.ok(w.some((x) => /agent-answer/.test(x)));
  assert.ok(w.some((x) => /ref missing/.test(x)));
  assert.ok(w.some((x) => /reason "meh"/.test(x)));
});
