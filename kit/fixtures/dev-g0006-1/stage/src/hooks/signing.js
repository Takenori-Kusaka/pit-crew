import { timingSafeEqual, createHmac } from 'node:crypto';
import { setting } from '../config/settings.js';

// The key partners sign their webhook calls with. It always comes from outside; see docs/hook-signing.md.
export function readSigningKey(env = process.env) {
  const v = setting('HOOK_SIGNING_KEY', env);
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

const LEGACY = /^v1:/;

// Called once at start-up (src/server.js). In production a missing or legacy key stops the start.
export function assertSigningKeyConfigured(env = process.env) {
  const key = readSigningKey(env);
  if (env.NODE_ENV !== 'production') return key;
  if (!key) throw new Error('[hooks] HOOK_SIGNING_KEY is required in production');
  if (LEGACY.test(key)) throw new Error('[hooks] a v1: signing key is not accepted in production');
  return key;
}

export function sign(body, key) {
  return createHmac('sha256', key).update(body).digest('hex');
}

export function verify(body, signature, key) {
  if (!key || typeof signature !== 'string') return false;
  const want = Buffer.from(sign(body, key), 'hex');
  const got = Buffer.from(signature, 'hex');
  return want.length === got.length && timingSafeEqual(want, got);
}
