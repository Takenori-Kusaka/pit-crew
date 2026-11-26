import { serverError } from '../http.js';

// GET /health
export async function handle(req, deps) {
  try {
    await deps.db.ping();
    return { status: 200, body: { ok: true } };
  } catch (err) {
    return serverError('health', err);
  }
}
