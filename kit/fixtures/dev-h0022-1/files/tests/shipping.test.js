import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shippingFee } from '../src/shipping.js';

test('a large order ships free', () => {
  assert.equal(shippingFee(8000, 'near'), 0);
});

test('a small order pays the fee of its region', () => {
  assert.equal(shippingFee(1200, 'near'), 600);
  assert.equal(shippingFee(1200, 'far'), 900);
  assert.equal(shippingFee(1200, 'island'), 1500);
});

test('an unknown region is an error', () => {
  assert.throws(() => shippingFee(1200, 'moon'), /unknown region/);
});
