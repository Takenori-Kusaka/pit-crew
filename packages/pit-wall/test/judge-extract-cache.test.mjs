// The extraction cache must not remember transport failures (ollama down / killed mid-run):
// a rerun has to retry them, while real (even unparsable) model answers stay cached.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractTargetedBatch, isTransportError } from '../src/graders/process/judge/extract.mjs';

test('isTransportError: fetch/HTTP failures yes, unparsable output and real answers no', () => {
  assert.equal(isTransportError({ out: null, error: 'ollama 500: boom' }), true);
  assert.equal(isTransportError({ out: null, error: 'fetch failed' }), true);
  assert.equal(isTransportError({ out: null, error: 'unparsable: {' }), false);
  assert.equal(isTransportError({ out: { options: [] }, error: null }), false);
  assert.equal(isTransportError(undefined), false);
});

test('a failed call is not written to the cache; the next batch retries it and caches the answer', async () => {
  const items = [{ text: 'We will reuse the helper because it exists.', options: [{ id: 'p0', text: 'reuse the helper' }] }];
  let calls = 0;
  const failing = async () => { calls++; throw new Error('fetch failed'); };
  const cache = {};
  const b1 = await extractTargetedBatch(['m1', 'm2'], items, { cache, fetchImpl: failing });
  assert.equal(calls, 2);
  assert.deepEqual(Object.keys(cache), []);
  assert.equal(b1.get(items[0]).status, 'abstain');
  assert.equal(b1.get(items[0]).raws[0].error, 'fetch failed');
  const answer = { options: [{ id: 'p0', mentioned: true, evidence: 'reuse the helper', claimed_adopted: true, pros: ['it exists'], cons: [] }], other_options: [], trivial_claim: false };
  const ok = async () => ({ ok: true, json: async () => ({ message: { content: JSON.stringify(answer) }, prompt_eval_count: 10 }) });
  const b2 = await extractTargetedBatch(['m1', 'm2'], items, { cache, fetchImpl: ok });
  assert.equal(Object.keys(cache).length, 2);
  assert.equal(b2.get(items[0]).status, 'ok');
  // a third batch makes no calls at all
  let calls3 = 0;
  await extractTargetedBatch(['m1', 'm2'], items, { cache, fetchImpl: async () => { calls3++; throw new Error('should not be called'); } });
  assert.equal(calls3, 0);
});
