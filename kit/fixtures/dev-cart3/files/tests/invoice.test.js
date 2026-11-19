import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invoice } from '../src/invoice.js';

test('a wholesale order below 10 lines is invoiced at list price', () => {
  const order = [{ price: 100, qty: 2 }, { price: 50, qty: 1 }, { price: 30, qty: 1 }];
  assert.equal(invoice('acme', order).due, 280);
});

test('a wholesale order of 10 lines gets 5% off, half a yen rounded up', () => {
  const order = Array.from({ length: 10 }, () => ({ price: 11, qty: 1 }));
  assert.equal(invoice('acme', order).due, 105); // 110 * 0.95 = 104.5, as on the price list
});
