import { overlaps, parseSlot } from './slots.js';

export function createBook() {
  return { bookings: [], nextId: 1 };
}

export function book(store, { room, slot, person }) {
  const s = parseSlot(slot);
  const clash = store.bookings.find((b) => b.room === room && overlaps(b, s));
  if (clash) return { ok: false, reason: 'taken', by: clash.id };
  const booking = { id: store.nextId++, room, person, ...s };
  store.bookings.push(booking);
  return { ok: true, booking };
}

export function cancel(store, id) {
  const i = store.bookings.findIndex((b) => b.id === id);
  if (i < 0) return null;
  return store.bookings.splice(i, 1)[0];
}

export function bookingsOn(store, day) {
  return store.bookings.filter((b) => b.day === day).sort((a, b) => a.start - b.start);
}
