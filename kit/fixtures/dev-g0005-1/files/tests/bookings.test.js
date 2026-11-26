import { test } from 'node:test';
import assert from 'node:assert/strict';
import { book, bookingsOn, cancel, createBook } from '../src/bookings.js';

test('a free slot is booked', () => {
  const store = createBook();
  const r = book(store, { room: 'small', slot: '2026-03-04 09:00-10:00', person: 'mio' });
  assert.equal(r.ok, true);
  assert.equal(r.booking.id, 1);
});

test('a taken slot is refused and names the booking that holds it', () => {
  const store = createBook();
  book(store, { room: 'small', slot: '2026-03-04 09:00-10:00', person: 'mio' });
  assert.deepEqual(book(store, { room: 'small', slot: '2026-03-04 09:30-10:30', person: 'ken' }), { ok: false, reason: 'taken', by: 1 });
  assert.equal(book(store, { room: 'large', slot: '2026-03-04 09:30-10:30', person: 'ken' }).ok, true);
});

test('a cancelled booking frees its slot', () => {
  const store = createBook();
  book(store, { room: 'small', slot: '2026-03-04 09:00-10:00', person: 'mio' });
  assert.equal(cancel(store, 1).person, 'mio');
  assert.equal(cancel(store, 1), null);
  assert.equal(book(store, { room: 'small', slot: '2026-03-04 09:00-10:00', person: 'ken' }).ok, true);
});

test('the bookings of a day are listed by start time', () => {
  const store = createBook();
  book(store, { room: 'small', slot: '2026-03-04 13:00-14:00', person: 'mio' });
  book(store, { room: 'large', slot: '2026-03-04 09:00-10:00', person: 'ken' });
  book(store, { room: 'large', slot: '2026-03-05 09:00-10:00', person: 'ken' });
  assert.deepEqual(bookingsOn(store, '2026-03-04').map((b) => b.person), ['ken', 'mio']);
});
