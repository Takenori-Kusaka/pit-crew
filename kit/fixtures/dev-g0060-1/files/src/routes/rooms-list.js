import { serverError } from '../http.js';

// GET /rooms
export async function handle(req, deps) {
  try {
    return { status: 200, body: await deps.rooms.all() };
  } catch (err) {
    return serverError('rooms-list', err);
  }
}
