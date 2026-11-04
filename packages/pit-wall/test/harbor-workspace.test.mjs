// An arm's workspace/ files go into /app and are hidden from git; without one, nothing changes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dockerfile, listFiles } from '../src/runners/harbor.mjs';

test('workspace files are copied into /app and each is excluded from git', () => {
  const d = dockerfile('img', false, {}, ['docs/sessions/dev-session.md', 'docs/sessions/dev-process/README.md']);
  assert.match(d, /COPY harness-workspace\/ \/app\//);
  assert.match(d, /'docs\/sessions\/dev-session\.md' 'docs\/sessions\/dev-process\/README\.md' >> \/app\/\.git\/info\/exclude/);
});

test('no workspace, no workspace lines (the Dockerfile of other arms is unchanged)', () => {
  const d = dockerfile('img', true, { A: '1' });
  assert.doesNotMatch(d, /harness-workspace/);
  assert.equal(d, dockerfile('img', true, { A: '1' }, []));
});

test('listFiles returns sorted relative paths', () => {
  const root = mkdtempSync(join(tmpdir(), 'ws-'));
  mkdirSync(join(root, 'docs/sessions/dev-process'), { recursive: true });
  writeFileSync(join(root, 'docs/sessions/b.md'), 'x');
  writeFileSync(join(root, 'docs/sessions/dev-process/a.md'), 'x');
  assert.deepEqual(listFiles(root), ['docs/sessions/b.md', 'docs/sessions/dev-process/a.md']);
  rmSync(root, { recursive: true, force: true });
});
