import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setting } from '../src/config/settings.js';

test('the environment wins', () => {
  assert.equal(setting('BOOKING_TIMEZONE', { BOOKING_TIMEZONE: 'Asia/Tokyo' }), 'Asia/Tokyo');
});

test('a mounted file is read when the environment has nothing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cfg-'));
  writeFileSync(join(dir, 'HOOK_TIMEOUT_MS'), '8000\n');
  assert.equal(setting('HOOK_TIMEOUT_MS', { CONFIG_DIR: dir }), '8000');
});

test('the default is used last', () => {
  assert.equal(setting('BOOKING_TIMEZONE', {}), 'UTC');
});
