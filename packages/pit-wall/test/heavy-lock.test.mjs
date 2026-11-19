// One heavy job per host: the lock is taken, refused while a live process holds it, taken over when
// its process is gone, and passed to children of a holding script.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { acquire } from '../src/runners/heavy-lock.mjs';
import { shouldStopWindows } from '../src/runners/admission.mjs';

const withLock = (fn) => {
  const root = mkdtempSync(join(tmpdir(), 'heavy-'));
  process.env.PITWALL_HEAVY_LOCK = join(root, 'heavy.lock');
  try { fn(process.env.PITWALL_HEAVY_LOCK); } finally { delete process.env.PITWALL_HEAVY_LOCK; delete process.env.PITWALL_HEAVY_HELD; rmSync(root, { recursive: true, force: true }); }
};

test('take and release', () => withLock((dir) => {
  const release = acquire('t');
  assert.ok(existsSync(dir));
  release();
  assert.ok(!existsSync(dir));
}));

test('refused while another live process holds it', () => withLock((dir) => {
  mkdirSync(dir);
  writeFileSync(join(dir, 'owner'), `${process.ppid}\tother\tnow\n`);
  assert.throws(() => acquire('t'), /another heavy job/);
}));

test('a stale lock (process gone) is taken over', () => withLock((dir) => {
  mkdirSync(dir);
  writeFileSync(join(dir, 'owner'), '999999999\tgone\tthen\n');
  const release = acquire('t');
  release();
  assert.ok(!existsSync(dir));
}));

test('children of a holding script run under it and do not release it', () => withLock((dir) => {
  mkdirSync(dir);
  writeFileSync(join(dir, 'owner'), `${process.ppid}\tscript\tnow\n`);
  process.env.PITWALL_HEAVY_HELD = '1';
  const release = acquire('child');
  release();
  assert.ok(existsSync(dir), 'still held by the script');
}));

test('windows watchdog: stops only after 2 checks below the reserve', () => {
  assert.equal(shouldStopWindows([1500], 2048), false);
  assert.equal(shouldStopWindows([5000, 1500], 2048), false);
  assert.equal(shouldStopWindows([1500, 1200], 2048), true);
});
