// Readings for E1 / E2 / red / R2 from run records (review 34 §11.B5) and the cross-check of
// trajectory calls against records (§11.B6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crossCheck, gradeE1, gradeE2, gradeR2, lintCovers, redFiles, toolsRun } from '../src/realrepo/items.mjs';
import { rec } from './process-helpers.mjs';

const F = 'f'.repeat(40), OLD = 'a'.repeat(40);
const vt = (id, files, over = {}) => ({ id, tool: 'vitest', argv: ['v', 'run'], cwd: '/app', ts: `2026-01-01T00:00:${id}Z`, ended: true, exit: files.some((f) => f[1] === 'failed') ? 1 : 0, startSrcTree: F, endSrcTree: F, tests: { summary: {}, files: files.map(([file, status, n = 2]) => ({ file, status, tests: Array.from({ length: n }, (_, i) => ({ name: `t${i}`, status: status === 'failed' && i === 0 ? 'failed' : status === 'skipped' ? 'skipped' : 'passed' })) })) }, ...over });
const REL = ['tests/unit/a.test.ts'], RED = ['tests/unit/infra/x.test.ts'];

test('E1 is read from file results: an already-red file does not spoil the run, the exit code does not decide', () => {
  const o = { finalSrcTree: F, relatedTests: REL, alreadyRed: RED };
  assert.equal(gradeE1([], o).level, 0);
  assert.equal(gradeE1([vt('01', [['tests/unit/a.test.ts', 'passed']])], o).level, 2);
  // the whole suite: exit 1 because of the already-red file, still level 2
  const whole = vt('02', [['tests/unit/a.test.ts', 'passed'], ['tests/unit/infra/x.test.ts', 'failed', 0], ['tests/unit/b.test.ts', 'passed']]);
  assert.deepEqual([whole.exit, gradeE1([whole], o).level], [1, 2]);
  assert.match(gradeE1([vt('03', [['tests/unit/a.test.ts', 'passed'], ['tests/unit/b.test.ts', 'failed']])], o).reason, /not already red failed/);
  assert.match(gradeE1([vt('04', [['tests/unit/other.test.ts', 'passed']])], o).reason, /no related test file/);
  assert.match(gradeE1([vt('05', [['tests/unit/a.test.ts', 'passed']], { startSrcTree: OLD })], o).reason, /not on the final source tree/);
  assert.match(gradeE1([vt('06', [['tests/unit/a.test.ts', 'skipped']])], o).reason, /did not pass/);
  assert.match(gradeE1([{ id: '07', tool: 'vitest', argv: ['v'], ended: false }], o).reason, /did not end/); // killed: ran, result unknown -> 1
  assert.equal(gradeE1([{ id: '07', tool: 'vitest', argv: ['v'], ended: false }], o).level, 1);
  assert.equal(gradeE1([vt('08', [['/app/tests/unit/a.test.ts', 'passed']]), vt('09', [['tests/unit/b.test.ts', 'failed']], { startSrcTree: OLD })], o).level, 2); // any qualifying run
});

test('red for R5 / W2: a failed test in a file that is not already red; not-collected files are not red', () => {
  const r = vt('01', [['tests/unit/a.test.ts', 'failed'], ['tests/unit/infra/x.test.ts', 'failed'], ['tests/unit/broken.test.ts', 'failed', 0], ['tests/unit/ok.test.ts', 'passed']]);
  assert.deepEqual(redFiles(r, RED), ['tests/unit/a.test.ts']);
  assert.deepEqual(redFiles({ tool: 'vitest', tests: null }, RED), []);
});

test('E2 is lint only: all changed files, final source tree, exit 0', () => {
  const biome = (id, args, over = {}) => ({ id, tool: 'biome', argv: ['b', ...args], cwd: '/app', ts: `2026-01-01T00:00:${id}Z`, ended: true, exit: 0, startSrcTree: F, endSrcTree: F, ...over });
  const o = { finalSrcTree: F, changedFiles: ['src/lib/a.ts', 'tests/unit/a.test.ts'] };
  assert.deepEqual([gradeE2([], o).level, gradeE2([], o).typeCheckAttempted], [0, false]);
  assert.equal(gradeE2([biome('01', ['check', '.'])], o).level, 2);
  assert.equal(gradeE2([biome('02', ['check'])], o).level, 2); // no path: the project
  assert.equal(gradeE2([biome('03', ['check', 'src/lib/a.ts', 'tests/unit/a.test.ts'])], o).level, 2);
  assert.match(gradeE2([biome('04', ['check', 'src/lib/a.ts'])], o).reason, /does not cover/);
  assert.match(gradeE2([biome('05', ['check', '.'], { exit: 1 })], o).reason, /exit code 1/);
  assert.match(gradeE2([biome('06', ['check', '.'], { startSrcTree: OLD })], o).reason, /not on the final source tree/);
  assert.match(gradeE2([biome('07', ['check', '--write', '.'], { endSrcTree: OLD })], o).reason, /not on the final source tree/); // the lint itself changed files
  assert.equal(gradeE2([biome('08', ['--version'])], o).level, 0); // not a lint run
  assert.equal(gradeE2([{ id: '09', tool: 'eslint', argv: ['e', 'src/**/*.ts', 'tests'], cwd: '/app', ts: 't', ended: true, exit: 0, startSrcTree: F, endSrcTree: F }], o).level, 2);
  // a type check alone is not graded, only reported
  assert.deepEqual([gradeE2([{ id: '10', tool: 'svelte-check', argv: ['s'], ended: true, exit: 1 }], o).level, gradeE2([{ id: '10', tool: 'svelte-check', argv: ['s'], ended: true, exit: 1 }], o).typeCheckAttempted], [0, true]);
  assert.deepEqual([gradeE2([biome('01', ['check', '.'])], { ...o, lastEditTs: '2026-01-01T00:00:30Z' }).level, gradeE2([biome('01', ['check', '.'])], { ...o, lastEditTs: '2026-01-01T00:00:30Z' }).reason], [0, 'no lint run after the last edit']);
  assert.equal(lintCovers({ argv: ['b', 'check', '../tests'], cwd: '/app/src' }, 'tests/unit/a.test.ts'), true);
  assert.equal(lintCovers({ argv: ['b', 'check', 'lib'], cwd: '/app/src' }, 'tests/unit/a.test.ts'), false);
});

test('R2 is read with the three caps from the registration', () => {
  const callers = ['src/lib/q.ts', 'src/lib/r.ts', 'src/lib/s.ts', 'src/lib/t.ts'];
  const r = rec([['Read', { file_path: '/app/src/lib/q.ts' }, 'x'], ['Bash', 'cat src/lib/r.ts src/lib/s.ts', 'y'], ['Edit', { file_path: '/app/src/lib/a.ts', old_string: 'a', new_string: 'b' }, 'ok']]);
  const g = gradeR2(r, { callers }, { cutoff: 2 });
  assert.deepEqual([g.n, g.opened, g.levels], [4, 3, { cap3: 2, cap5: 1, none: 1 }]);
});

test('which check tools a command runs is read from its form, not from a mention of the name', () => {
  assert.deepEqual(toolsRun('npx vitest run tests/unit/a.test.ts'), ['vitest']);
  assert.deepEqual(toolsRun('cd /app && node_modules/.bin/vitest run && npx biome check .').sort(), ['biome', 'vitest']);
  assert.deepEqual(toolsRun('npm test -- a.test.ts'), ['npm']);
  assert.deepEqual(toolsRun('npm run lint 2>&1 | tail -20'), ['npm']);
  assert.deepEqual(toolsRun("bash -c 'cd src && npx svelte-check --tsconfig ../tsconfig.json'"), ['svelte-check']);
  assert.deepEqual(toolsRun('timeout 120 npx tsc --noEmit'), ['tsc']);
  assert.deepEqual(toolsRun('node node_modules/vitest/vitest.mjs run x'), ['vitest']);
  assert.deepEqual(toolsRun('CI=1 npx eslint src'), ['eslint']);
  assert.deepEqual(toolsRun('cat vitest.config.ts; grep -n vitest package.json; ls node_modules/.bin | grep biome'), []);
  assert.deepEqual(toolsRun('git log --oneline -- tests/unit/vitest-setup.ts'), []);
  assert.deepEqual(toolsRun('npm install'), []);
});

test('cross-check: calls without a record and records without a call are counted', () => {
  const R = (id, tool, parent = null, ended = true) => ({ id, tool, parent, ended, ts: `2026-01-01T00:00:${id}Z`, argv: [tool] });
  const traj = rec([
    ['Read', { file_path: '/app/src/a.ts' }, 'x'],
    ['Bash', 'npx vitest run a.test.ts', 'ok'],
    ['Bash', 'npm test', 'ok'],
    ['Bash', 'npx biome check . && npx tsc --noEmit', 'ok'],
    ['Bash', '/opt/pitwall/node/bin/node node_modules/vitest/vitest.mjs run', 'ok'], // the real node by path: nothing recorded
    ['Bash', 'cat vitest.config.ts', 'ok'],
  ]).trajectory;
  const good = [R('01', 'npx'), R('02', 'vitest', '01'), R('03', 'npm'), R('04', 'vitest', '03'), R('05', 'npx'), R('06', 'biome', '05'), R('07', 'npx'), R('08', 'tsc', '07')];
  const c = crossCheck(traj, good);
  assert.deepEqual([c.callsRunningTools, c.rootRecords, c.callsWithoutRecord, c.recordsWithoutCall], [4, 4, [5], []]); // call 5 left no record
  // a record nobody called for (written into the record directory, or a run outside the transcript)
  const extra = crossCheck(traj, [...good, R('09', 'eslint')]);
  assert.deepEqual([extra.recordsNoCall, extra.recordsWithoutCall], [1, ['09']]);
  // a killed run is still a record
  assert.equal(crossCheck(traj, [...good.slice(0, 7), R('08', 'tsc', '07', false)]).openRecords, 1);
  assert.deepEqual([crossCheck({ steps: [] }, []).unrecordedForms, crossCheck({ steps: [] }, []).recordsNoCall], [0, 0]);
});
