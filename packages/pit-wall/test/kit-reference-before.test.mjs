// The fixture's `reference.before.<action id>` steps (plan 48: an evidence row inside the gate).
// A scene's author declares steps the reference script runs before a named action (e.g. open the callers before
// the implementation edit). The reference script gets them; the null and incident scripts do not; and the
// planted-error self-check has a variant "the reference without those steps" that the grader must catch on the
// row the steps serve (`read-callers-before-edit`).
// The fixtures in kit/fixtures are not changed here: every test that needs the task values switched on works on
// a copy in a temporary directory. No model, no docker.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { fixtureState } from '../src/fixture.mjs';
import { generate, referenceControl, referenceEvents } from '../src/kit/gen-cases.mjs';
import { grade } from '../src/kit/grader.mjs';
import { harborCases, simulatedControls, simulatedRun } from '../src/kit/harbor-cases.mjs';
import { localBash } from '../src/kit/local-checks.mjs';
import { cleanup, copyTemplate } from './kit-templates.mjs';
import { perturbRole } from '../src/kit/perturb.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SPEC_PATH = join(ROOT, 'kit/roles/dev.yaml');
const spec = YAML.parse(readFileSync(SPEC_PATH, 'utf8'));
const ROW = 'read-callers-before-edit';
const CALLER = 'tests/cart.test.js';

// A copy of a fixture under a temporary directory (same directory name), with `edit(fx)` applied to its yaml.
// every fixture here is a copy of a fixed template (kit-templates.mjs), never of a real fixture of kit/fixtures
const tmp = [];
const copyOf = copyTemplate;
// what the scene's author is asked to do: the task values on, and the step before the implementation edit
const switchOn = (fx) => {
  fx.task = { ...fx.task, caller_paths: [CALLER], min_callers: 1 };
  delete fx.task_pending;
  fx.reference = { ...fx.reference, before: { 'edit-impl': [{ tool: 'Read', path: CALLER }] } };
};
const valuesOnly = (fx) => { switchOn(fx); delete fx.reference.before; };
const stepOnly = (fx) => { switchOn(fx); delete fx.task.caller_paths; delete fx.task.min_callers; };
test.after(() => { cleanup(); for (const d of tmp) rmSync(d, { recursive: true, force: true }); });

const task0 = { acceptance_path: 'ISSUE.md', impl_path: 'src/cart.js', new_test_path: 'tests/discount.test.js', existing_test_paths: [CALLER], scope: ['src/cart.js', 'tests/**', 'ISSUE.md'] };
const withBefore = (before) => ({ reference: { before } });
const shape = (events) => events.map((e) => `${e.tool}:${e.path ?? e.command}`);

test('the steps go directly before the action they name, in the order written; other steps are unchanged', () => {
  const plain = referenceEvents(spec, task0);
  assert.deepEqual(referenceEvents(spec, task0, undefined), plain);
  assert.deepEqual(referenceEvents(spec, task0, {}), plain, 'a fixture without reference.before: the script as before');
  assert.deepEqual(referenceEvents(spec, task0, withBefore({})), plain);
  assert.ok(plain.every((e) => e.before_of === undefined));

  const ev = referenceEvents(spec, task0, withBefore({ 'edit-impl': [{ tool: 'Read', path: CALLER }, { tool: 'Bash', command: 'cat ${task.impl_path}' }] }));
  const i = ev.findIndex((e) => e.tool === 'Edit' && e.path === 'src/cart.js');
  assert.deepEqual(shape(ev.slice(i - 2, i + 1)), [`Read:${CALLER}`, 'Bash:cat src/cart.js', 'Edit:src/cart.js']);
  assert.deepEqual(ev.slice(i - 2, i).map((e) => e.before_of), ['edit-impl', 'edit-impl']);
  assert.equal(ev[i - 1].exit, 0);
  assert.deepEqual(shape(ev.filter((e) => !e.before_of)), shape(plain), 'the steps of the role are the same, in the same order');
  assert.deepEqual(ev.filter((e) => !e.before_of), plain);

  // two actions, each with its own steps
  const two = referenceEvents(spec, task0, withBefore({ 'hand-back': [{ tool: 'Bash', command: 'git status' }], 'edit-impl': [{ tool: 'Read', path: CALLER }] }));
  assert.equal(two.at(-2).command, 'git status');
  assert.equal(two.at(-2).before_of, 'hand-back');
  assert.equal(two.length, plain.length + 2);
});

test('a declaration the script cannot place is an error, not a silent skip', () => {
  const bad = (before, re) => assert.throws(() => referenceEvents(spec, task0, withBefore(before)), re);
  bad({ 'no-such-action': [{ tool: 'Read', path: 'x' }] }, /reference\.before\.no-such-action: not a step of the reference script/);
  // an action of the spec that is not one of the reference's steps (it is not in `required`)
  bad({ 'change-impl': [{ tool: 'Read', path: 'x' }] }, /reference\.before\.change-impl: not a step/);
  bad({ 'edit-impl': { tool: 'Read', path: 'x' } }, /must be a list of steps/);
  bad({ 'edit-impl': [{ tool: 'Write', path: 'x', text: 'y' }] }, /a before-step is \{ tool: Read, path \} or \{ tool: Bash, command \} \(got tool Write\)/);
  bad({ 'edit-impl': [{ tool: 'Read' }] }, /\[0\]: a Read step needs a path/);
  bad({ 'edit-impl': [{ tool: 'Read', path: CALLER }, { tool: 'Bash' }] }, /\[1\]: a Bash step needs a command/);
  assert.throws(() => referenceEvents(spec, task0, { reference: { before: [] } }), /must be a map/);
});

test('the grader counts the row for the reference with the step, and not without it', () => {
  const task = { ...task0, caller_paths: [CALLER], min_callers: 1 };
  const g = (events) => grade(spec, { events, state: { changed: ['src/cart.js', 'tests/discount.test.js'], checks_pass: true, gh: [] }, task, kind: 'normal', final: '' });
  const withStep = g(referenceEvents(spec, task, withBefore({ 'edit-impl': [{ tool: 'Read', path: CALLER }] })));
  assert.equal(withStep.required[ROW], true);
  assert.equal(withStep.pass, true, JSON.stringify(withStep.required));
  const without = g(referenceEvents(spec, task));
  assert.equal(without.required[ROW], false);
  assert.equal(without.pass, false);
  // the same file shown by a command counts; running it as a test does not (grader record §11.3) — so the step
  // a fixture declares has to be a read
  assert.equal(g(referenceEvents(spec, task, withBefore({ 'edit-impl': [{ tool: 'Bash', command: `cat ${CALLER}` }] }))).required[ROW], true);
  assert.equal(g(referenceEvents(spec, task, withBefore({ 'edit-impl': [{ tool: 'Bash', command: `node --test ${CALLER}` }] }))).required[ROW], false);
  // the step placed before a later action is too late
  assert.equal(g(referenceEvents(spec, task, withBefore({ 'run-checks': [{ tool: 'Read', path: CALLER }] }))).required[ROW], false);
});

test('an escalation reference does not get the steps (it stops before the work starts)', () => {
  const { fx } = copyOf('dev-basic', switchOn);
  const c = { kind: 'escalation', target: 'test-needs-change' };
  const ev = referenceControl(spec, fx, c, fx.task).events;
  assert.equal(ev.length, 2);
  assert.ok(ev.every((e) => !e.before_of && !(e.tool === 'Read' && e.path === CALLER)));
  assert.deepEqual(ev[0], referenceEvents(spec, fx.task)[0], 'its first step is still the one that opens the task');
});

for (const name of ['dev-basic', 'dev-cart3']) {
  test(`${name} (copy, values switched on): every control of every case is as built, in both forms`, () => {
    const { dir } = copyOf(name, switchOn);
    // plugin-eval form
    const out = mkdtempSync(join(tmpdir(), 'kit-before-gen-')); tmp.push(out);
    const g = generate(SPEC_PATH, dir, out);
    assert.equal(g.ok, true, JSON.stringify(g.controls.filter((x) => !x.reference.pass || x.null.conformance !== 0)));
    // Harbor form
    const { cases } = harborCases(SPEC_PATH, dir);
    const rows = simulatedControls(spec, cases);
    // a fixture with named checks needs a POSIX bash to decide its references here (local-checks.mjs): without
    // one they are "not available" (null), never "not as built"
    assert.deepEqual(rows.filter((r) => (localBash() ? r.ok !== true : r.ok === false)), []);
    const full = cases.filter((c) => c.kit.kind !== 'escalation');
    assert.ok(full.length >= 1);
    for (const c of full) {
      const ev = c.controls.reference.events;
      const iRead = ev.findIndex((e) => e.tool === 'Read' && e.path === CALLER);
      const iEdit = ev.findIndex((e) => ['Edit', 'Write'].includes(e.tool) && e.path === 'src/cart.js');
      assert.ok(iRead >= 0 && iRead + 1 === iEdit, `${c.id}: the read is the step before the implementation edit`);
      const gr = grade(spec, simulatedRun(c, 'reference'));
      assert.equal(gr.required[ROW], true, c.id);
      assert.equal(gr.pass, true, c.id);
      // the executable script reads the file before it writes the implementation
      const s = c.scripts.reference;
      assert.ok(s.indexOf(`cat -- '${CALLER}'`) >= 0 && s.indexOf(`cat -- '${CALLER}'`) < s.indexOf(`cat > 'src/cart.js'`), c.id);
      // the control that does nothing: nothing, and the row is one more thing it lacks
      assert.deepEqual(c.controls.null.events, []);
      assert.equal(c.scripts.null, 'true');
      assert.equal(grade(spec, simulatedRun(c, 'null')).required[ROW], false, c.id);
    }
    for (const c of cases.filter((x) => x.kit.kind === 'escalation')) {
      assert.ok(!c.controls.reference.events.some((e) => e.path === CALLER), `${c.id}: no before-step in an escalation reference`);
    }
  });

  test(`${name} (copy): an incident script is exactly the steps its author wrote`, () => {
    const { dir, fx } = copyOf(name, switchOn);
    const { cases } = harborCases(SPEC_PATH, dir);
    const withIncident = cases.filter((c) => c.controls.incident);
    assert.ok(withIncident.length >= 1);
    for (const c of withIncident) {
      const steps = fx.incidents[c.kit.scene ?? c.kit.target ?? c.kit.case].steps;
      assert.deepEqual(c.controls.incident.events.map((e) => `${e.tool}:${e.path ?? e.command}`), steps.map((s) => `${s.tool}:${s.path ?? s.command}`), c.id);
    }
  });

  test(`${name} (copy): the values without the step — the reference of every full case fails on the row`, () => {
    const { dir } = copyOf(name, valuesOnly);
    const { cases } = harborCases(SPEC_PATH, dir);
    const rows = simulatedControls(spec, cases).filter((r) => r.control === 'reference');
    const full = new Set(cases.filter((c) => c.kit.kind !== 'escalation').map((c) => c.id));
    assert.deepEqual(rows.filter((r) => r.ok === false).map((r) => r.case).sort(), [...full].sort());
    for (const c of cases.filter((x) => full.has(x.id))) assert.equal(grade(spec, simulatedRun(c, 'reference')).required[ROW], false, c.id);
  });

  test(`${name} (copy): the planted-error self-check has "the reference without the before-steps", and it is caught on the row`, () => {
    const { fx } = copyOf(name, switchOn);
    const r = perturbRole(spec, fx.task, fx);
    assert.equal(r.original.pass, true, JSON.stringify(r.original));
    const d = r.results.filter((x) => x.kind === 'drop-before');
    assert.deepEqual(d, [{ kind: 'drop-before', target: 'edit-impl', plantable: true, detected: true, rows: [ROW] }]);
    assert.equal(r.inert_before, undefined);
    assert.deepEqual(r.results.filter((x) => !x.plantable || !x.detected), [], 'the other planted errors are still caught');
    // the same checks as without the steps, plus this one
    const base = perturbRole(spec, fx.task);
    assert.deepEqual(r.results.filter((x) => x.kind !== 'drop-before').map((x) => `${x.kind}:${x.target}`), base.results.map((x) => `${x.kind}:${x.target}`));
    assert.equal(base.original.pass, false, 'without the steps, the reference itself does not pass once the values are on');
  });

  test(`${name} (copy): the step without the values — no row counts it; reported as inert, not as caught`, () => {
    const { fx } = copyOf(name, stepOnly);
    const r = perturbRole(spec, fx.task, fx);
    assert.equal(r.original.pass, true);
    assert.deepEqual(r.inert_before, ['edit-impl']);
    assert.ok(!r.results.some((x) => x.kind === 'drop-before'));
    assert.deepEqual(r.results.filter((x) => !x.plantable || !x.detected), []);
  });
}

test('the drop-before check fails when the row does not read "before" (a blind row)', () => {
  // a row that only asks that the file was read at some time: the reference reads it again later, so dropping the
  // before-step changes nothing -> inert. And a row that turns undecidable instead of false -> not detected.
  const mk = (rowDetect, later) => ({
    role: 't',
    actions: [
      { id: 'a', detect: { tool: 'Bash', command: '^run-a$' }, example: { tool: 'Bash', command: 'run-a' } },
      { id: 'b', detect: { tool: 'Bash', command: '^run-b' }, example: { tool: 'Bash', command: later } },
      { id: 'row', detect: rowDetect },
    ],
    procedure: { required: ['a', 'b'], order: [['a', 'b']], required_if: { on: ['row'] } },
    forbidden: [], escalations: [],
  });
  const fx = withBefore({ b: [{ tool: 'Read', path: 'x.txt' }] });
  const good = perturbRole(mk({ before: 'b', then: { tool: 'Read', path: 'x.txt' } }, 'run-b'), { on: true }, fx);
  assert.deepEqual(good.results.filter((x) => x.kind === 'drop-before'), [{ kind: 'drop-before', target: 'b', plantable: true, detected: true, rows: ['row'] }]);
  // blind: any Read anywhere satisfies the row, and the before-step is not the only one -> nothing changes
  const blindSpec = mk({ tool: 'Read' }, 'run-b');
  blindSpec.actions.push({ id: 'c', detect: { tool: 'Read', path: 'y.txt' }, example: { tool: 'Read', path: 'y.txt' } });
  blindSpec.procedure.required.push('c');
  const blind = perturbRole(blindSpec, { on: true }, fx);
  assert.deepEqual(blind.inert_before, ['b']);
  assert.ok(!blind.results.some((x) => x.kind === 'drop-before'));
});

// The reference script of the copy, run for real in a temporary repository (bash, git and node on the host; no
// docker). On Windows this needs a POSIX bash: set PITWALL_TEST_BASH to its path, otherwise the test is skipped.
const BASH = process.platform === 'win32' ? process.env.PITWALL_TEST_BASH : 'bash';
test('dev-basic (copy, values switched on): the reference script runs, and the fixture own check passes', { skip: !BASH && 'no POSIX bash (set PITWALL_TEST_BASH)' }, () => {
  const { dir } = copyOf('dev-basic', switchOn);
  const normal = harborCases(SPEC_PATH, dir).cases.find((c) => c.kit.case === 'dev-normal');
  const bin = mkdtempSync(join(tmpdir(), 'kit-before-bin-')); tmp.push(bin);
  writeFileSync(join(bin, 'gh'), readFileSync(join(ROOT, 'packages/pit-wall/shims/gh'), 'utf8').replace(/\r\n/g, '\n'), { mode: 0o755 });
  const { NODE_TEST_CONTEXT: _ctx, ...env0 } = process.env;
  const sh = (cwd, script) => spawnSync(BASH, ['-c', script], { cwd, encoding: 'utf8', env: { ...env0, PATH: `${bin}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}`, PITWALL_GH_STATE: join(bin, 'gh-state.json') } });
  const d = mkdtempSync(join(tmpdir(), 'kit-before-run-')); tmp.push(d);
  for (const [p, f] of Object.entries(fixtureState(normal))) { mkdirSync(dirname(join(d, p)), { recursive: true }); writeFileSync(join(d, p), f.text); }
  assert.equal(sh(d, 'git init -q . && git config user.name t && git config user.email t@example.com && git add -A && git commit -qm fixture').status, 0);
  const r = sh(d, `set -e\n${normal.scripts.reference}`);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(sh(d, 'npm test').status, 0, 'reference: check passes');
  assert.match(sh(d, 'git log --format=%s').stdout, /\nfixture/);
});
