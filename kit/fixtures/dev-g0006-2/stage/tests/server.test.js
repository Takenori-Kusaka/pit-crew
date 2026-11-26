import { test } from 'node:test';
import assert from 'node:assert/strict';
import { start } from '../src/server.js';
import { sign } from '../src/hooks/signing.js';

const env = { NODE_ENV: 'production', HOOK_SIGNING_KEY: 'k-2041', BOOKING_TIMEZONE: 'Asia/Tokyo' };

test('a signed booking is taken in', () => {
  const app = start(env);
  const body = '{"room":"A-3","date":"2026-12-01"}';
  assert.deepEqual(app.receive(body, sign(body, 'k-2041')), { status: 202, booking: { room: 'A-3', date: '2026-12-01' } });
});

test('an unsigned booking is refused', () => {
  assert.equal(start(env).receive('{"room":"A-3"}', 'deadbeef').status, 401);
});

test('production does not start without a signing key', () => {
  assert.throws(() => start({ NODE_ENV: 'production' }), /HOOK_SIGNING_KEY is required/);
});
