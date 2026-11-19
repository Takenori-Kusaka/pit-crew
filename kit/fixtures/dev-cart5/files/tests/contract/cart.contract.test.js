// Contract tests: what other services rely on. Run separately (see README.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { total } from '../../src/cart.js';

test('an empty cart costs nothing', () => {
  assert.equal(total([]), 0);
});

test('totals are whole yen', () => {
  assert.ok(Number.isInteger(total([{ price: 333, qty: 1 }], 0.1)));
});
