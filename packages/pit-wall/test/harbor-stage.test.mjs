// Staging of Harbor tasks and jobs on the Linux file system when the run directory is on a
// Windows drive mounted into WSL. Run under WSL from the repository on /mnt/<x>/ for the
// "staged" cases; elsewhere they are skipped.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stage } from '../src/runners/harbor.mjs';

const onMount = /^\/mnt\/[a-z]\//.test(process.cwd());
const fixture = (root) => {
  mkdirSync(join(root, 'harbor-tasks', 'c1', 'environment'), { recursive: true });
  writeFileSync(join(root, 'harbor-tasks', 'c1', 'task.toml'), 'x');
  return join(root, 'harbor-tasks');
};

test('on a /mnt drive: tasks are staged, the job tree comes back, staging is removed', { skip: !onMount }, () => {
  const run = mkdtempSync(join(process.cwd(), '..', '..', '.stage-test-'));
  const stageRoot = mkdtempSync(join(tmpdir(), 'stage-root-'));
  process.env.PITWALL_STAGE_DIR = stageRoot;
  try {
    const jobs = join(run, 'out-jobs');
    const st = stage(fixture(run), 'c1', jobs);
    assert.ok(st.task.startsWith(stageRoot), 'task is under the staging root');
    assert.ok(existsSync(join(st.task, 'task.toml')));
    mkdirSync(join(st.jobs, '2026-01-01__00-00-00', 'c1__abc'), { recursive: true });
    writeFileSync(join(st.jobs, '2026-01-01__00-00-00', 'c1__abc', 'result.json'), '{}');
    st.finish();
    assert.equal(readFileSync(join(jobs, '2026-01-01__00-00-00', 'c1__abc', 'result.json'), 'utf8'), '{}');
    assert.deepEqual(readdirSync(stageRoot), [], 'staging removed');
  } finally {
    delete process.env.PITWALL_STAGE_DIR;
    rmSync(run, { recursive: true, force: true });
    rmSync(stageRoot, { recursive: true, force: true });
  }
});

test('off the mount, nothing is staged (paths unchanged)', () => {
  const run = mkdtempSync(join(tmpdir(), 'stage-off-'));
  try {
    const jobs = join(run, 'out-jobs');
    const st = stage(fixture(run), 'c1', jobs);
    assert.equal(st.task, join(run, 'harbor-tasks', 'c1'));
    assert.equal(st.jobs, jobs);
  } finally { rmSync(run, { recursive: true, force: true }); }
});

test('PITWALL_STAGE=0 turns staging off even on the mount', { skip: !onMount }, () => {
  const run = mkdtempSync(join(process.cwd(), '..', '..', '.stage-test-'));
  process.env.PITWALL_STAGE = '0';
  try {
    const st = stage(fixture(run), 'c1', join(run, 'j'));
    assert.equal(st.task, join(run, 'harbor-tasks', 'c1'));
  } finally { delete process.env.PITWALL_STAGE; rmSync(run, { recursive: true, force: true }); }
});

test('staging left by a dead process is removed; a live one is kept', { skip: !onMount }, () => {
  const run = mkdtempSync(join(process.cwd(), '..', '..', '.stage-test-'));
  const stageRoot = mkdtempSync(join(tmpdir(), 'stage-root-'));
  process.env.PITWALL_STAGE_DIR = stageRoot;
  mkdirSync(join(stageRoot, '999999999-1'));
  mkdirSync(join(stageRoot, `${process.pid}-1`));
  try {
    const st = stage(fixture(run), 'c1', join(run, 'j'));
    const left = readdirSync(stageRoot);
    assert.ok(!left.includes('999999999-1'), 'dead one removed');
    assert.ok(left.includes(`${process.pid}-1`), 'live one kept');
    st.finish();
  } finally {
    delete process.env.PITWALL_STAGE_DIR;
    rmSync(run, { recursive: true, force: true });
    rmSync(stageRoot, { recursive: true, force: true });
  }
});

test('session state is pruned from a job; transcripts and other evidence stay', async () => {
  const { pruneSessionState } = await import('../src/runners/harbor.mjs');
  const root = mkdtempSync(join(tmpdir(), 'prune-'));
  const s = join(root, '2026-01-01__00-00-00', 'c1__abc', 'agent', 'sessions');
  mkdirSync(join(s, 'projects', '-app'), { recursive: true });
  mkdirSync(join(s, 'backups'), { recursive: true });
  writeFileSync(join(s, 'projects', '-app', 'x.jsonl'), '{}');
  writeFileSync(join(s, 'policy-limits.json.signature.json'), 'jwt');
  writeFileSync(join(s, '.claude.json'), '{"userID":"u"}');
  writeFileSync(join(root, '2026-01-01__00-00-00', 'c1__abc', 'result.json'), '{}');
  try {
    assert.equal(pruneSessionState(root), 3);
    assert.deepEqual(readdirSync(s), ['projects']);
    assert.ok(existsSync(join(s, 'projects', '-app', 'x.jsonl')));
    assert.ok(existsSync(join(root, '2026-01-01__00-00-00', 'c1__abc', 'result.json')));
    assert.equal(pruneSessionState(join(root, 'missing')), 0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
