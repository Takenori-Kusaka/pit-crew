// A history entry with `branch` builds a side branch (a PR's head) while the agent starts on
// the named default branch; histories without `branch` are unchanged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commits, defaultBranch, expectedHead, fixtureState, writeFixture } from '../src/fixture.mjs';

const kase = {
  issue: { number: 7, body: 'ticket' },
  history: [
    { date: '2026-09-15T09:00:00+00:00', message: 'initial', branch: 'develop', files: { 'README.md': 'base', 'src/a.sh': 'echo a' } },
    { date: '2026-10-20T09:00:00+00:00', message: 'fix(a): one (#7)', branch: 'fix/T-7', files: { 'src/a.sh': 'echo b', 'spec/a.spec.sh': 'true' } },
    { date: '2026-10-21T09:00:00+00:00', message: 'fix(a): two (#7)', branch: 'fix/T-7', files: { 'src/a.sh': 'echo c' } },
  ],
};

test('fixtureState is the default branch: side-branch files are not in the start state', () => {
  const st = fixtureState(kase);
  assert.equal(st['src/a.sh'].text, 'echo a\n');
  assert.ok(!st['spec/a.spec.sh']);
  assert.ok(st['.github-cache/issue-7.md']);
  assert.equal(defaultBranch(commits(kase)), 'develop');
});

test('build.sh cuts the side branch from the default tip, stacks its commits and returns to the default branch', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pw-fx-'));
  try {
    writeFixture(dir, kase);
    const sh = readFileSync(join(dir, 'fixture', 'build.sh'), 'utf8');
    assert.match(sh, /git branch -M 'develop'/);
    assert.equal((sh.match(/git checkout -q 'fix\/T-7' 2>\/dev\/null \|\| git checkout -q -b 'fix\/T-7'/g) ?? []).length, 2);
    assert.equal((sh.match(/git checkout -q 'develop'/g) ?? []).length, 2);
    // The last line records the head after the return to develop.
    assert.ok(sh.trimEnd().endsWith('git rev-parse HEAD > /etc/pitwall/fixture-head'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('expectedHead is the default branch tip; the side branch exists with two commits ahead of it', () => {
  // Rebuild the same history by hand and compare the ids with expectedHead (fixed dates).
  const dir = mkdtempSync(join(tmpdir(), 'pw-fx2-'));
  const git = (args, env = {}) => execFileSync('git', ['-c', 'core.autocrlf=false', '-c', 'commit.gpgsign=false', ...args], { cwd: dir, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
  try {
    const head = expectedHead(kase);
    git(['init', '-q', '.']);
    const list = commits(kase);
    for (const c of list.filter((c) => !c.branch || c.branch === 'develop')) {
      for (const [p, t] of Object.entries(c.files)) { execFileSync('mkdir', ['-p', join(dir, p, '..')]); execFileSync('bash', ['-c', `printf '%s\\n' "$1" > "$2"`, '_', t, join(dir, p)]); }
      git(['add', '-A']);
      git(['-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com', 'commit', '-q', '-m', c.message], { GIT_AUTHOR_DATE: c.date, GIT_COMMITTER_DATE: c.date });
    }
    assert.equal(git(['rev-parse', 'HEAD']), head);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a side branch without a named default branch is refused; a plain history is unchanged', () => {
  assert.throws(() => fixtureState({ history: [{ date: '2026-01-01T00:00:00+00:00', message: 'a', files: {} }, { date: '2026-01-02T00:00:00+00:00', message: 'b', branch: 'x', files: {} }] }), /name the default branch/);
  const plain = { history: [{ date: '2026-01-01T00:00:00+00:00', message: 'a', files: { 'f': '1' } }, { date: '2026-01-02T00:00:00+00:00', message: 'b', files: { 'f': '2' } }] };
  assert.equal(fixtureState(plain).f.text, '2\n');
  const dir = mkdtempSync(join(tmpdir(), 'pw-fx3-'));
  try {
    writeFixture(dir, plain);
    const sh = readFileSync(join(dir, 'fixture', 'build.sh'), 'utf8');
    assert.ok(!/checkout|branch -M/.test(sh));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
