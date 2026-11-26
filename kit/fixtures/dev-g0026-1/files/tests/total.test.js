import { test } from 'node:test';
import assert from 'node:assert/strict';
import { receiptTotal } from '../src/total.js';

test('lines are summed', () => {
  assert.equal(receiptTotal([{ price: 120, qty: 2 }, { price: 300, qty: 1 }]), 540);
});

test('no discount keeps the subtotal', () => {
  assert.equal(receiptTotal([{ price: 999, qty: 1 }], 0), 999);
});
