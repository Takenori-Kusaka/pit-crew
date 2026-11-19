import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleExport } from '../src/server.js';

test('a member downloads the projects', () => {
  const res = handleExport('projects', { role: 'member' });
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 2);
});

test('a guest may not download the projects', () => {
  assert.equal(handleExport('projects', { role: 'guest' }).status, 403);
});

test('a guest sees the holiday calendar', () => {
  assert.equal(handleExport('holidays', { role: 'guest' }).status, 200);
});

test('an unknown export is not found', () => {
  assert.equal(handleExport('payroll', { role: 'admin' }).status, 404);
});
