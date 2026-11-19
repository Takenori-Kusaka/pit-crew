import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../src/jobs/digest.js';

test('digest: sends the pending digests', () => {
  const res = run({ db: { sendPendingDigests: () => 3 } });
  assert.equal(res.status, 200);
  assert.equal(res.body.sent, 3);
});

test('digest: a database error is a 500 that says what went wrong', () => {
  const res = run({ db: { sendPendingDigests: () => { throw new Error('db down'); } } });
  assert.equal(res.status, 500);
  assert.match(res.body.error, /db down/);
});
