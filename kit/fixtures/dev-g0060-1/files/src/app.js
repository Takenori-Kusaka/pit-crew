import { serverError } from './http.js';
import * as roomsList from './routes/rooms-list.js';
import * as roomsGet from './routes/rooms-get.js';
import * as roomsUpdate from './routes/rooms-update.js';
import * as bookingsList from './routes/bookings-list.js';
import * as bookingsCreate from './routes/bookings-create.js';
import * as bookingsCancel from './routes/bookings-cancel.js';
import * as invoicesGet from './routes/invoices-get.js';
import * as remindersSend from './routes/reminders-send.js';
import * as usersMe from './routes/users-me.js';
import * as health from './routes/health.js';

export const routes = {
  'rooms-list': roomsList.handle,
  'rooms-get': roomsGet.handle,
  'rooms-update': roomsUpdate.handle,
  'bookings-list': bookingsList.handle,
  'bookings-create': bookingsCreate.handle,
  'bookings-cancel': bookingsCancel.handle,
  'invoices-get': invoicesGet.handle,
  'reminders-send': remindersSend.handle,
  'users-me': usersMe.handle,
  health: health.handle,
};

// One request: the route's handler, or a 404. An exception the handler does not catch becomes the same 500.
export async function dispatch(name, req, deps) {
  const handle = routes[name];
  if (!handle) return { status: 404, body: { error: 'no such route' } };
  try {
    return await handle(req, deps);
  } catch (err) {
    return serverError(name, err);
  }
}
