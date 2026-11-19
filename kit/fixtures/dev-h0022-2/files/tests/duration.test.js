import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDuration } from '../src/duration.js';

test('hours and minutes', () => {
  assert.equal(formatDuration(5400), '1h 30m');
});

test('minutes only', () => {
  assert.equal(formatDuration(2700), '45m');
  assert.equal(formatDuration(59), '0m');
});

test('a negative or fractional duration is an error', () => {
  assert.throws(() => formatDuration(-1), RangeError);
  assert.throws(() => formatDuration(1.5), RangeError);
});
