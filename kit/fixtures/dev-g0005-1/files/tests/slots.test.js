import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatSlot, overlaps, parseSlot } from '../src/slots.js';

test('a slot is parsed to minutes from midnight', () => {
  assert.deepEqual(parseSlot('2026-03-04 09:00-10:30'), { day: '2026-03-04', start: 540, end: 630 });
});

test('a slot that is not well written is refused', () => {
  assert.throws(() => parseSlot('tomorrow morning'), /not a slot/);
});

test('a slot must end after it starts', () => {
  assert.throws(() => parseSlot('2026-03-04 10:00-10:00'), /end after/);
});

test('a slot must be inside the opening hours', () => {
  assert.throws(() => parseSlot('2026-03-04 07:00-09:00'), /opening hours/);
  assert.throws(() => parseSlot('2026-03-04 19:00-21:00'), /opening hours/);
});

test('a slot is written back the way it was read', () => {
  assert.equal(formatSlot(parseSlot('2026-03-04 08:05-09:30')), '2026-03-04 08:05-09:30');
});

test('slots overlap only on the same day and at the same time', () => {
  const a = parseSlot('2026-03-04 09:00-10:00');
  assert.equal(overlaps(a, parseSlot('2026-03-04 09:30-11:00')), true);
  assert.equal(overlaps(a, parseSlot('2026-03-04 10:00-11:00')), false);
  assert.equal(overlaps(a, parseSlot('2026-03-05 09:00-10:00')), false);
});
