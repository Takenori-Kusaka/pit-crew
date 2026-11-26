import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatYen } from '../src/format.js';

test('a small amount is printed with the yen sign', () => {
  assert.equal(formatYen(540), '¥540');
});
