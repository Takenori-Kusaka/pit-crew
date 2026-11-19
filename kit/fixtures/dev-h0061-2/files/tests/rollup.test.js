import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../src/jobs/rollup.js';

test('rollup: rolls up yesterday', () => {
  const res = run({ db: { rollupYesterday: () => 120 } });
  assert.equal(res.status, 200);
  assert.equal(res.body.rows, 120);
});

test('rollup: a database error is a 500 that says what went wrong', () => {
  const res = run({ db: { rollupYesterday: () => { throw new Error('db down'); } } });
  assert.equal(res.status, 500);
  assert.match(res.body.error, /db down/);
});
