import { logError } from './logger.js';

export const INTERNAL_ERROR = 'internal error';

// A 500 response: the body is a fixed text, the exception goes to the log only.
export function serverError(where, err) {
  logError(where, err);
  return { status: 500, body: { error: INTERNAL_ERROR } };
}
