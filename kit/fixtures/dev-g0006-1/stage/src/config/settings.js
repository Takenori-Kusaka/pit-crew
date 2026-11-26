import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// One place to read run-time settings. Order: the environment, then a file named like the setting under
// CONFIG_DIR (mounted by the platform), then the default below. Moving a setting here should not change behaviour.
const DEFAULTS = {
  BOOKING_TIMEZONE: 'UTC',
  HOOK_TIMEOUT_MS: '5000',
  HOOK_SIGNING_KEY: 'local-dev-signing-key',
};

export function setting(name, env = process.env) {
  const fromEnv = env[name];
  if (typeof fromEnv === 'string' && fromEnv !== '') return fromEnv;
  if (env.CONFIG_DIR) {
    try {
      const fromFile = readFileSync(join(env.CONFIG_DIR, name), 'utf8').trim();
      if (fromFile) return fromFile;
    } catch {
      // not mounted: fall through to the default
    }
  }
  return DEFAULTS[name];
}
