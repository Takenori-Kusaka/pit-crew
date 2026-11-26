import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatReceipt } from '../src/receipts.js';

test('a receipt shows the charge and the amount', () => {
  assert.equal(formatReceipt({ id: 'ch_7', amount: 12800 }), 'Receipt ch_7: 12,800 yen');
});
