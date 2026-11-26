import { timingSafeEqual, createHmac } from 'node:crypto';

// The key partners sign their webhook calls with.
export function readSigningKey(env = process.env) {
  const v = env.HOOK_SIGNING_KEY;
  return typeof v === 'string' && v.trim() ? v.trim() : null;
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
