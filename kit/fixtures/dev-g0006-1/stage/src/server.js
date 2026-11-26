import { assertSigningKeyConfigured, verify } from './hooks/signing.js';
import { setting } from './config/settings.js';

// Start the service: check the signing key once, then hand back what the handlers need.
export function start(env = process.env) {
  const key = assertSigningKeyConfigured(env);
  const timezone = setting('BOOKING_TIMEZONE', env);
  return {
    timezone,
    receive(body, signature) {
      if (!verify(body, signature, key)) return { status: 401 };
      return { status: 202, booking: JSON.parse(body) };
    },
  };
}
