// "A check seen red before the fix" (role action saw-red-before-impl) read from the call's OUTPUT as well as its exit
// code. In gate run 3 every with-harness trial of h-0061-1 ran `npm test 2>&1 | grep …`: the output shows `not ok`, the
// pipe ends 0, and the exit-only reading said "never red" (verify-gate3.md 7.5, defect 4; kit/results/dev/round2-defects.md).
// The mark of a failed test depends on the test tool, so the fixture gives it (`task.red_output`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import YAML from 'yaml';
import { grade } from '../src/kit/grader.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const dev = YAML.parse(readFileSync(join(root, 'kit/roles/dev.yaml'), 'utf8'));
const base = { impl_path: 'src/a.js', new_test_path: 'tests/a.test.js', scope: ['src/**', 'tests/**'], red_first: true };
const TAP_RED = 'TAP version 13\nok 1 - old\nnot ok 2 - a guest may not\n# fail 1\n';
const run = (events, task = { ...base, red_output: '^not ok [0-9]' }) => ({ events, state: { changed: ['src/a.js', 'tests/a.test.js'], checks_pass: true, gh: [] }, task, kind: 'normal' });
const write = { tool: 'Write', path: 'tests/a.test.js', old: '', new: 'test' };
const fix = { tool: 'Edit', path: 'src/a.js', old: 'a', new: 'b' };
const red = (piped) => ({ tool: 'Bash', command: piped ? 'npm test 2>&1 | grep -E "^not ok|^# fail"' : 'npm test', exit: piped ? 0 : 1, output: TAP_RED });
const saw = (r) => grade(dev, r).action['saw-red-before-impl'];

test('a red check hidden by a pipe counts when the output shows the fixture\'s mark of a failed test', () => {
  assert.equal(saw(run([write, red(true), fix])), true);
});
test('the exit code still counts on its own', () => {
  assert.equal(saw(run([write, red(false), fix], { ...base })), true);
});
test('without the fixture\'s mark, a piped red is not counted (as before)', () => {
  assert.equal(saw(run([write, red(true), fix], { ...base })), false);
});
test('a passing output, or the red seen only after the fix, does not count', () => {
  assert.equal(saw(run([write, { ...red(true), output: 'ok 1 - old\nok 2 - a\n# fail 0\n' }, fix])), false);
  assert.equal(saw(run([write, fix, red(true)])), false);
});
test('a call whose output was not recorded is undecidable for the output branch', () => {
  const { output: _o, ...noOut } = red(true);
  assert.equal(saw(run([write, noOut, fix])), null);
});
