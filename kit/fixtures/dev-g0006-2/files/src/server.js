import { readSigningKey, verify } from './hooks/signing.js';

// Start the service and hand back what the handlers need.
export function start(env = process.env) {
  const key = readSigningKey(env);
  const timezone = env.BOOKING_TIMEZONE || 'UTC';
  return {
    timezone,
    receive(body, signature) {
      if (!verify(body, signature, key)) return { status: 401 };
      return { status: 202, booking: JSON.parse(body) };
    },
  };
}
