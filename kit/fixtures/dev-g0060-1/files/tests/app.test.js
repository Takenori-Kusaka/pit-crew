import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dispatch } from '../src/app.js';
import { logged } from '../src/logger.js';

const room = { id: 'r1', name: 'Maple' };
const deps = {
  rooms: { all: async () => [room], find: async (id) => (id === 'r1' ? room : null), update: async (id, v) => ({ id, ...v }) },
  bookings: { forRoom: async () => [{ id: 'b1', roomId: 'r1', date: '2026-12-01' }], create: async (b) => ({ id: 'b2', ...b }), cancel: async () => {} },
  invoices: { find: async (id) => ({ id, total: 12000 }) },
  mailer: { sendReminders: async () => 3 },
  users: { find: async (id) => ({ id, name: 'Aki' }) },
  db: { ping: async () => {} },
};

test('a room is found', async () => {
  assert.deepEqual(await dispatch('rooms-get', { params: { id: 'r1' } }, deps), { status: 200, body: room });
});

test('an unknown room is a 404', async () => {
  assert.equal((await dispatch('rooms-get', { params: { id: 'zz' } }, deps)).status, 404);
});

test('a booking is created', async () => {
  const r = await dispatch('bookings-create', { body: { roomId: 'r1', date: '2026-12-01' } }, deps);
  assert.equal(r.status, 201);
  assert.equal(r.body.roomId, 'r1');
});

test('a booking without a date is a 400', async () => {
  assert.equal((await dispatch('bookings-create', { body: { roomId: 'r1' } }, deps)).status, 400);
});

test('reminders are sent for a day', async () => {
  assert.deepEqual(await dispatch('reminders-send', { query: { date: '2026-12-01' } }, deps), { status: 200, body: { sent: 3 } });
});

test('an unknown route is a 404', async () => {
  assert.equal((await dispatch('nope', {}, deps)).status, 404);
});

test('the room list answers a fixed text when the store fails, and logs the error', async () => {
  const failing = { ...deps, rooms: { all: async () => { throw new Error('SQLITE_BUSY: database is locked'); } } };
  const r = await dispatch('rooms-list', {}, failing);
  assert.deepEqual(r, { status: 500, body: { error: 'internal error' } });
  assert.match(logged.at(-1).detail, /SQLITE_BUSY/);
});
