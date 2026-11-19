import { test } from 'node:test';
import assert from 'node:assert/strict';
import { total, itemCount } from '../src/cart.js';

test('total without discount', () => {
  assert.equal(total([{ price: 100, qty: 2 }, { price: 50, qty: 1 }]), 250);
});

test('item count', () => {
  assert.equal(itemCount([{ price: 1, qty: 3 }, { price: 1, qty: 2 }]), 5);
});

test('bulk discount rounds the half yen up', () => {
  const lines = Array.from({ length: 10 }, () => ({ price: 11, qty: 1 }));
  assert.equal(total(lines), 105); // 110 * 0.95 = 104.5
});
