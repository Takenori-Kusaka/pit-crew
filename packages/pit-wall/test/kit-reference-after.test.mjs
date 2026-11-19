// The fixture's `reference.after.<action id>` steps (kit/schema/role-spec.md): steps the reference script runs directly
// after a named action. The reference built from the role's examples hands back with `git commit -am "fix"`: it pushes
// nothing, and it leaves the new test file out of the commit. With a logged remote and task.handback_via_branch, the
// row hand-back-via-branch-or-pr reads the remote's refs, so that reference could never pass. These steps let a scene's
// author add `git add <the new test>` after add-test and `git push` after hand-back, without changing the role spec.
// Part 2 replays the template dev-scene (a remote with branches) without a container (POSIX bash; on Windows set
// PITWALL_TEST_BASH). No model, no docker, no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { referenceControl, referenceEvents } from '../src/kit/gen-cases.mjs';
import { runLocal } from '../src/kit/capture-local.mjs';
import { harborCases, simulatedControls } from '../src/kit/harbor-cases.mjs';
import { perturbRole } from '../src/kit/perturb.mjs';
import { ROOT, cleanup, copyTemplate, specPath } from './kit-templates.mjs';

test.after(cleanup);
const spec = YAML.parse(readFileSync(join(ROOT, 'kit/roles/dev.yaml'), 'utf8'));
const task0 = { acceptance_path: 'ISSUE.md', impl_path: 'src/cart.js', new_test_path: 'tests/discount.test.js', existing_test_paths: ['tests/cart.test.js'], scope: ['src/cart.js', 'tests/**', 'ISSUE.md'] };
const shape = (events) => events.map((e) => `${e.tool}:${e.path ?? e.command}`);
// the two steps a scene with a logged remote needs (the form written in role-spec.md)
const AFTER = { 'add-test': [{ tool: 'Bash', command: 'git add ${task.new_test_path}' }], 'hand-back': [{ tool: 'Bash', command: 'git push -q -u origin HEAD' }] };

test('the steps go directly after the action they name, in the order written; the role\'s steps are unchanged', () => {
  const plain = referenceEvents(spec, task0);
  assert.deepEqual(referenceEvents(spec, task0, { reference: { after: {} } }), plain);
  const ev = referenceEvents(spec, task0, { reference: { after: AFTER } });
  const w = ev.findIndex((e) => e.tool === 'Write' && e.path === 'tests/discount.test.js');
  assert.deepEqual(shape(ev.slice(w, w + 2)), ['Write:tests/discount.test.js', 'Bash:git add tests/discount.test.js'], '${task.x} is filled');
  assert.equal(ev[w + 1].after_of, 'add-test');
  assert.equal(ev[w + 1].exit, 0);
  assert.deepEqual(shape(ev.slice(-2)), ['Bash:git commit -am "fix"', 'Bash:git push -q -u origin HEAD']);
  assert.equal(ev.at(-1).after_of, 'hand-back');
  assert.deepEqual(ev.filter((e) => !e.after_of), plain, 'without them, the script is the one built from the examples');
  // before and after on the same action: before ... action ... after
  const both = referenceEvents(spec, task0, { reference: { before: { 'hand-back': [{ tool: 'Bash', command: 'git status' }] }, after: { 'hand-back': [{ tool: 'Bash', command: 'git log -1' }, { tool: 'Read', path: 'ISSUE.md' }] } } });
  assert.deepEqual(shape(both.slice(-4)), ['Bash:git status', 'Bash:git commit -am "fix"', 'Bash:git log -1', 'Read:ISSUE.md']);
  // the work branch is still cut before the first change of a file (an after-step of read-task stays before it)
  const early = referenceEvents(spec, task0, { reference: { after: { 'read-task': [{ tool: 'Bash', command: 'git fetch -q' }] } } });
  assert.deepEqual(shape(early.slice(1, 3)), ['Bash:git fetch -q', 'Bash:git checkout -b work/reference']);
});

test('a declaration that cannot be placed is an error, with the same rules as reference.before', () => {
  const ev = (after) => () => referenceEvents(spec, task0, { reference: { after } });
  assert.throws(ev([]), /reference\.after must be a map/);
  assert.throws(ev({ 'push-it': [{ tool: 'Bash', command: 'git push' }] }), /reference\.after\.push-it: not a step of the reference script/);
  assert.throws(ev({ 'hand-back': { tool: 'Bash', command: 'git push' } }), /reference\.after\.hand-back must be a list/);
  assert.throws(ev({ 'hand-back': [{ tool: 'Write', path: 'x', text: 'y' }] }), /reference\.after\.hand-back\[0\]: an after-step is \{ tool: Read, path \} or \{ tool: Bash, command \} \(got tool Write\)/);
  assert.throws(ev({ 'hand-back': [{ tool: 'Edit', path: 'x' }] }), /got tool Edit/);
  assert.throws(ev({ 'hand-back': [{ tool: 'Bash' }] }), /a Bash step needs a command/);
  assert.throws(ev({ 'hand-back': [{ tool: 'Read' }] }), /a Read step needs a path/);
});

test('only the full reference gets them: not an escalation\'s reference, the null script or an incident script', () => {
  const fx = { reference: { after: AFTER }, issue: { number: 12 } };
  const esc = referenceControl(spec, fx, { kind: 'escalation', target: spec.escalations[0].id }, task0);
  assert.ok(esc.events.every((e) => !e.after_of));
  const { dir } = copyTemplate('dev-scene', (f) => { f.reference.after = AFTER; });
  const k = harborCases(specPath('dev'), dir).cases.find((c) => c.kit.case === 'dev-normal');
  // the case's controls carry the steps, not the marks: look for the commands
  const mine = (e) => e.tool === 'Bash' && ['git add tests/discount.test.js', 'git push -q -u origin HEAD'].includes(e.command);
  assert.equal(k.controls.reference.events.filter(mine).length, 2);
  for (const n of ['null', 'incident']) assert.ok(!(k.controls[n].events ?? []).some(mine), n);
  const escs = harborCases(specPath('dev'), dir).cases.filter((c) => /esc/.test(c.kit.case));
  assert.ok(escs.length > 0);
  for (const c of escs) assert.ok(!(c.controls.reference.events ?? []).some(mine), c.id);
});

test('the planted-error self-check takes the after-steps out (drop-after); one no simulated row counts is listed, not counted', () => {
  const r = perturbRole(spec, task0, { reference: { after: AFTER } });
  assert.equal(r.original.pass, true);
  // without a remote in the simulated state, neither step changes a row: both are listed as inert
  assert.deepEqual(r.inert_after, ['add-test', 'hand-back']);
  assert.ok(!r.results.some((x) => x.kind === 'drop-after'));
  const base = perturbRole(spec, task0);
  assert.deepEqual(r.results.map((x) => `${x.kind}:${x.target}`), base.results.map((x) => `${x.kind}:${x.target}`));
  assert.equal(base.inert_after, undefined);
});

// ---- part 2: the reference replayed on the template with a remote ---------------------------------------------
const BASH = process.platform === 'win32' ? process.env.PITWALL_TEST_BASH : 'bash';
const skip = !BASH && 'no POSIX bash (set PITWALL_TEST_BASH)';
const scene = (after) => {
  const { dir } = copyTemplate('dev-scene', (fx) => {
    fx.task.protected_refs = ['main', 'develop'];
    fx.task.handback_via_branch = true;
    if (after) fx.reference.after = after; else delete fx.reference.after;   // the template writes the two steps itself
  });
  const { spec: s, cases } = harborCases(specPath('dev'), dir);
  return { spec: s, k: cases.find((c) => c.kit.case === 'dev-normal') };
};

test('with a remote and handback_via_branch: the reference commits on a work branch and pushes it, and is graded as built', { skip }, () => {
  const { spec: s, k } = scene(AFTER);
  const rows = Object.fromEntries(simulatedControls(s, [k], { bash: BASH }).map((r) => [r.control, r]));
  for (const n of ['null', 'reference', 'incident']) assert.equal(rows[n].ok, true, `${n}: ${JSON.stringify(rows[n])}`);
  assert.equal(rows.reference.outcome, 'pass');
  const r = runLocal(k, { bash: BASH, script: 'reference' });
  const c = r.kit_facts.capture;
  assert.equal(c.git.branch, 'work/reference');
  assert.equal(c.remote.refs_after['refs/heads/work/reference'], c.git.head, 'the work branch is on the remote, at the commit');
  assert.equal(c.remote.refs_after['refs/heads/main'], c.remote.refs_before['refs/heads/main'], 'the mainline did not move');
  assert.deepEqual(c.git.uncommitted, [], 'the new test is in the commit (git add after add-test)');
  assert.equal(c.remote.logs_agree, true);
});

test('without the steps, the same reference cannot pass: nothing is pushed, and the new test is left out of the commit', { skip }, () => {
  const { spec: s, k } = scene(null);
  const row = simulatedControls(s, [k], { bash: BASH }).find((x) => x.control === 'reference');
  assert.equal(row.ok, false, JSON.stringify(row));
  const c = runLocal(k, { bash: BASH, script: 'reference' }).kit_facts.capture;
  assert.equal(c.remote.refs_after['refs/heads/work/reference'], undefined);
  assert.ok(c.git.uncommitted.includes('tests/discount.test.js'), JSON.stringify(c.git.uncommitted));
});

test('the template dev-scene writes the two steps as the example of role-spec.md, and its controls are as built', { skip }, () => {
  const { dir, fx } = copyTemplate('dev-scene');
  assert.deepEqual(fx.reference.after, AFTER);
  const { spec: s, cases } = harborCases(specPath('dev'), dir);
  const rows = simulatedControls(s, [cases.find((c) => c.kit.case === 'dev-normal')], { bash: BASH });
  for (const r of rows) assert.equal(r.ok, true, `${r.control}: ${JSON.stringify(r)}`);
});
