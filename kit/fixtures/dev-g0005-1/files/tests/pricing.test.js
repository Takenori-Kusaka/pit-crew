import { test } from 'node:test';
import assert from 'node:assert/strict';
import { price } from '../src/pricing.js';

test('a small room costs 1200 yen an hour', () => {
  assert.equal(price({ room: 'small', start: 540, end: 630 }), 1800);
});

test('4 hours or more get 10% off', () => {
  assert.equal(price({ room: 'large', start: 480, end: 720 }), 9360);
});

test('members get 20% off', () => {
  assert.equal(price({ room: 'small', start: 540, end: 600 }, { member: true }), 960);
});

test('an unknown room has no price', () => {
  assert.throws(() => price({ room: 'hall', start: 540, end: 600 }), /unknown room/);
});
