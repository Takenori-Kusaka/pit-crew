// Kit cases as Harbor tasks (W4 #98) and the environment fixes W0a asked for: the request asks for the
// hand-back, work files have a declared place that is not "out of scope", the fixture's own test command
// works, and the scripted controls are graded as built. No model, no docker.
// Every fixture read here is a fixed template of the tests (kit-templates.mjs) or a copy of one: this file tests
// the machinery and must not depend on what a scene's author files in kit/fixtures. What every REAL fixture must
// satisfy is checked, without pinning any shape, in kit-real-fixtures.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { fixtureState } from '../src/fixture.mjs';
import { dockerfile } from '../src/runners/harbor.mjs';
import { generate } from '../src/kit/gen-cases.mjs';
import { grade } from '../src/kit/grader.mjs';
import { cleanup, copyTemplate, loadTemplate, specPath, templateDir, templateYaml } from './kit-templates.mjs';
import { controlAsExpected, ghEffects, ghStateEffects, hasClosingReference, harborCases, kitRun, kitState, realize, simulatedControls, simulatedRun } from '../src/kit/harbor-cases.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const load = (role, fx) => loadTemplate(fx, role);
test.after(cleanup);
const sha = (t) => createHash('sha256').update(t).digest('hex');

test('a fixture makes Harbor cases whose controls are graded as built', () => {
  for (const fx of ['dev-basic', 'dev-cart3']) {
    const { spec, cases } = load('dev', fx);
    assert.ok(cases.length > 0, fx);
    const rows = simulatedControls(spec, cases);
    assert.deepEqual(rows.filter((r) => r.ok === false), [], fx);
    assert.ok(rows.filter((r) => r.control === 'null').every((r) => r.ok === true), `${fx}: a control that does nothing must fail`);
    assert.ok(rows.some((r) => r.control === 'incident'), `${fx}: the template has an incident script`);
  }
});

test('the same case list as the plugin-eval form, under ids that name the fixture', () => {
  const out = mkdtempSync(join(tmpdir(), 'kit-gen-'));
  const g = generate(specPath('dev'), templateDir('dev-cart3'), out);
  const h = load('dev', 'dev-cart3');
  assert.deepEqual(h.cases.map((c) => c.id), g.cases.map((id) => `dev-cart3__${id}`));
  // and the same request in both forms
  const p = readFileSync(join(out, 'evals', 'dev-normal', 'prompt.md'), 'utf8').split('\n---\n')[1].trim();
  assert.equal(h.cases[0].prompt, p);
  rmSync(out, { recursive: true, force: true });
});

test('W0a: the request asks for the hand-back and names the place for work files', () => {
  for (const fx of ['dev-basic', 'dev-cart3']) {
    const { cases } = load('dev', fx);
    for (const c of cases) {
      assert.match(c.prompt, /commit して戻してください/, c.id);
      assert.match(c.prompt, /`\.work\/` の下に置いてください/, c.id);
      assert.deepEqual(c.kit.scratch, ['.work/**']);
      assert.match(c.files['.gitignore'], /^\/\.work\/$/m);
    }
  }
  // a fixture that declares neither keeps its request as it was
  const plain = harborCases(specPath('dev'), copyTemplate('dev-basic', (fx) => { delete fx.handback; delete fx.scratch; }).dir).cases[0];
  assert.doesNotMatch(plain.prompt, /\.work|commit して戻してください/);
  assert.equal(plain.files['.gitignore'], undefined);
});

test('W0a: work files under the declared scratch place are not changed files; the same file elsewhere is', () => {
  const kase = load('dev', 'dev-basic').cases[0];
  const files = Object.fromEntries(Object.entries(fixtureState(kase)).map(([p, f]) => [p, { sha256: f.sha256 }]));
  const add = (p) => { files[p] = { sha256: sha(p) }; };
  add('.work/state.md'); add('.work/notes/plan.md'); add('.github-cache/pr-1.md');
  files['src/cart.js'] = { sha256: sha('edited') };
  assert.deepEqual(kitState({ files, checks: { check: 0 }, commands: { gh: [] } }, kase).changed, ['src/cart.js']);
  add('.dev-state.md');
  const st = kitState({ files, checks: { check: 1 }, commands: { gh: ['pr create --title x', 'issue comment 12 -b y'] } }, kase);
  assert.deepEqual(st.changed, ['.dev-state.md', 'src/cart.js']);
  assert.equal(st.checks_pass, false);
  assert.deepEqual(st.gh.sort(), ['issue_comment', 'pr_create']);
  delete files['package.json'];                                      // a removed file is a change too
  assert.ok(kitState({ files, checks: {}, commands: {} }, kase).changed.includes('package.json'));
  assert.equal(kitState({ files, checks: {}, commands: {} }, kase).checks_pass, null);
  assert.equal(kitState(null, kase).changed, undefined);            // no end state: not "nothing changed"
});

test('the incident control of a scene is judged as the forbidden outcome, the reference as a pass', () => {
  const { spec, cases } = load('dev', 'dev-cart3');
  // a scene of the fixture that has an incident script (which scenes do is the scene author's to decide)
  const scene = cases.filter((c) => c.kit.scene === 'bulk-two-lines');
  assert.equal(scene.length, 3);
  for (const c of scene) {
    assert.equal(c.controls.incident.expect, 'escalation:test-needs-change');
    assert.ok(c.scripts.incident.includes('items.length >= 2 ? 0.05 : 0'));
    for (const name of ['reference', 'null', 'incident']) {
      const g = grade(spec, simulatedRun(c, name));
      assert.equal(controlAsExpected(c.controls[name].expect, g), true, `${c.id} ${name}`);
    }
    assert.equal(grade(spec, simulatedRun(c, 'incident')).escalations['test-needs-change'].ok, false);
    assert.equal(grade(spec, simulatedRun(c, 'reference')).escalations['test-needs-change'].ok, true);
    // with no end state at all the grader does not guess: the control is not "as built"
    assert.equal(controlAsExpected('pass', grade(spec, kitRun(null, c, 'reference'))), false);
  }
  // scenes without an incident script have none (nothing is invented): neither the control nor its script
  const fx = templateYaml('dev-cart3');
  const without = cases.filter((c) => c.kit.scene && !(c.kit.scene in fx.incidents));
  assert.ok(without.some((c) => c.kit.scene === 'cap-discount'), 'dev-cart3 has a scene with no incident script');
  for (const c of without) { assert.equal(c.controls.incident, undefined, c.id); assert.equal('incident' in c.scripts, false, c.id); }
  // and a scene with one has it for each of its wordings
  for (const s of Object.keys(fx.incidents)) assert.ok(cases.filter((c) => c.kit.scene === s).every((c) => c.controls.incident?.events.length > 0), s);
});

test('control steps: an edit needs its content, and the script writes exactly the declared text', () => {
  const texts = { 'a.txt': 'one\ntwo' };
  const r = realize([{ tool: 'Edit', path: 'a.txt', old: 'two', new: 'three' }, { tool: 'Write', path: 'b/c.txt', text: 'x\n' }, { tool: 'Bash', command: 'git diff' }, { tool: 'Read', path: 'a.txt' }], texts);
  assert.deepEqual(r.events.map((e) => [e.tool, e.path ?? e.command, e.old, e.new]), [['Edit', 'a.txt', 'one\ntwo', 'one\nthree'], ['Write', 'b/c.txt', '', 'x'], ['Bash', 'git diff', undefined, undefined], ['Read', 'a.txt', undefined, undefined]]);
  assert.match(r.script, /cat > 'a\.txt' <<'PITWALL_EOF'\none\nthree\nPITWALL_EOF/);
  assert.throws(() => realize([{ tool: 'Edit', path: 'a.txt', old: 'absent', new: 'x' }], { 'a.txt': 'one' }), /does not contain/);
  assert.throws(() => realize([{ tool: 'Write', path: 'a.txt' }], {}), /no content/);
  // a fixture without reference content has no reference script, and says why
  const inv = harborCases(specPath('dev'), copyTemplate('dev-basic', (fx) => { delete fx.reference.files; }).dir).cases[0];
  assert.match(inv.controls.reference.unavailable, /reference content/);
  assert.equal(inv.scripts.reference, undefined);
});

// a saved model trial: exit codes and the text a Write replaced come from the record, when it holds them
const call = (tool, args, text = '', is_error = false) => ({ function_name: tool, arguments: args, extra: { result: { is_error, text } } });
const rec = (kase, calls, final = 'done') => ({ trajectory: { agent: {}, steps: [{ source: 'agent', message: final, tool_calls: calls }], final_message: final }, state: { files: fixtureState(kase), checks: { check: 0 }, commands: { gh: [] } } });

test('a model trial: exit codes are read from the result, and a Write gets its old text while that is known', () => {
  const kase = load('dev', 'dev-basic').cases[0];
  const old = fixtureState(kase)['tests/cart.test.js'].text;
  const r = kitRun(rec(kase, [
    call('Bash', { command: 'npm test' }, 'Exit code 1\nfail'),
    call('Bash', { command: 'git diff' }, 'ok'),
    call('Write', { file_path: '/app/tests/cart.test.js', content: 'no asserts left\n' }),
    call('Write', { file_path: '/app/tests/new.test.js', content: 'assert(1)\n' }),
  ]), kase);
  assert.deepEqual(r.events.map((e) => e.exit), [1, 0, undefined, undefined]);
  assert.equal(r.events[2].old, old);
  assert.equal(r.events[3].old, '');
  assert.equal(r.final, 'done');
  // after a command that can change files, the old text is not known: it stays absent (undecidable, not a hit)
  const s = kitRun(rec(kase, [call('Bash', { command: "sed -i 's/250/251/' tests/cart.test.js" }), call('Write', { file_path: '/app/tests/cart.test.js', content: 'x\n' })]), kase);
  assert.equal(s.events[1].old, undefined);
  const t = kitRun(rec(kase, [call('Bash', { command: 'npm test > out.txt' }), call('Write', { file_path: '/app/tests/cart.test.js', content: 'x\n' })]), kase);
  assert.equal(t.events[1].old, undefined);
  // an Edit before the Write is followed
  const u = kitRun(rec(kase, [call('Edit', { file_path: '/app/tests/cart.test.js', old_string: '250', new_string: '251' }), call('Write', { file_path: '/app/tests/cart.test.js', content: 'x\n' })]), kase);
  assert.equal(u.events[1].old, old.replace('250', '251'));
  // no transcript: the last message is absent, not empty
  assert.equal(kitRun({ trajectory: null, state: null }, kase).final, undefined);
});

test('gh effects are read from commands in any of the usual forms', () => {
  assert.deepEqual(ghEffects(['gh pr review 7 --approve', 'gh pr merge 7 --squash', 'cd x && gh issue comment 1 -b hi', 'gh pr edit 3 --add-label a']).sort(), ['issue_comment', 'label_add', 'pr_merge', 'pr_review_approve']);
  assert.deepEqual(ghEffects(['gh pr view 7', 'echo gh']), []);
});

test('gh effects: marking a PR ready, closing an issue, a closing reference — from the command text', () => {
  assert.deepEqual(ghEffects(['gh pr ready 7']), ['pr_ready']);
  assert.deepEqual(ghEffects(['gh pr ready 7 --undo', 'gh pr ready --undo 7']), []);
  assert.deepEqual(ghEffects(['cd x && gh issue close 12 -c done']), ['issue_close']);
  assert.deepEqual(ghEffects(['gh api -X PATCH repos/o/r/issues/12 -f state=closed']), ['issue_close']);
  assert.deepEqual(ghEffects(['gh api -f state=closed -X PATCH repos/o/r/issues/12']), ['issue_close']);
  assert.deepEqual(ghEffects(['gh api -X PATCH repos/o/r/pulls/12 -f state=closed', 'gh pr close 12', 'gh api repos/o/r/issues/12/comments -f body=state=closed']), []);
  assert.deepEqual(ghEffects(['git commit -am "fix the cart (Closes #12)"']), ['closing_reference']);
  assert.deepEqual(ghEffects(['git add -A && git commit -m "Fixes: o/r#12"']), ['closing_reference']);
  assert.deepEqual(ghEffects(['gh pr create -t "Fix cart" -b "Resolves https://github.com/o/r/issues/12"']).sort(), ['closing_reference', 'pr_create']);
  // not a closing reference: no issue named, the keyword in another command, a comment on an issue
  assert.deepEqual(ghEffects(['git commit -m "fix the cart"', 'git commit -m "refs #12"', 'git commit -m work; echo "fixes #3"', 'gh pr view 7 && echo closes #1']), []);
  assert.deepEqual(ghEffects(['gh issue comment 12 -b "this fixes #12"']), ['issue_comment']);
  for (const [text, want] of [['Closes #12', true], ['closed #1', true], ['Fix #3', true], ['fixed o/r#3', true], ['RESOLVES #9', true], ['resolve: #9', true], ['prefix #3', false], ['closes the door #3', false], ['fixes 12', false], ['see #12', false], [null, false]]) assert.equal(hasClosingReference(text), want, String(text));
});

test('gh effects from what the stand-in recorded: its state says what happened, its log says to which kind of item', () => {
  const st = (items, prs = []) => ({ items, created: { pullRequests: prs, issues: [] } });
  assert.deepEqual(ghStateEffects(null, ['pr ready 7']), []);
  assert.deepEqual(ghStateEffects(st({}), []), []);
  assert.deepEqual(ghStateEffects(st({ 7: { draft: false } }), ['pr ready 7']), ['pr_ready']);
  assert.deepEqual(ghStateEffects(st({ 7: { draft: true } }), ['pr ready 7', 'pr ready 7 --undo']), []);                       // made ready, then undone: the end state is a draft
  assert.deepEqual(ghStateEffects(st({}, [{ title: 't', draft: false }]), ['pr create -t t']), []);                              // a PR created ready is `pr_create`, not `pr_ready`
  assert.deepEqual(ghStateEffects(st({ 12: { state: 'closed' } }), ['issue close 12']), ['issue_close']);
  assert.deepEqual(ghStateEffects(st({ 12: { state: 'closed' } }), ['issue close https://github.com/o/r/issues/12 -r completed']), ['issue_close']);
  assert.deepEqual(ghStateEffects(st({ 12: { state: 'closed' } }), ['api -X PATCH repos/o/r/issues/12 -f state=closed']), ['issue_close']);
  assert.deepEqual(ghStateEffects(st({ 12: { state: 'closed' } }), ['pr close 12']), []);                                         // a PR was closed
  assert.deepEqual(ghStateEffects(st({ 12: { state: 'closed' } }), ['api -X PATCH repos/o/r/pulls/12 -f state=closed']), []);
  assert.deepEqual(ghStateEffects(st({ 12: { state: 'closed' }, 120: {} }), ['issue close 120', 'pr close 12']), []);            // another number
  assert.deepEqual(ghStateEffects(st({ 12: { state: 'open' } }), ['issue close 12', 'issue reopen 12']), []);                     // closed, then reopened
  // a line of a comment that reads like a call is not a call: the state has no closed item
  assert.deepEqual(ghStateEffects(st({ 12: { comments: ['next step:\nissue close 12'] } }), ['issue comment 12 -b next step:', 'issue close 12']), []);
  assert.deepEqual(ghStateEffects(st({}, [{ title: 'Fix cart', body: 'Closes #12', draft: true }]), ['pr create --draft -t Fix cart -b Closes #12']), ['closing_reference']);
  assert.deepEqual(ghStateEffects(st({ 7: { body: 'Fixes #12' } }), ['pr edit 7 --body-file body.md']), ['closing_reference']);
  assert.deepEqual(ghStateEffects(st({ 7: { body: 'Fixes #12' } }), ['issue edit 7 --body-file body.md']), []);                  // an issue's body closes nothing
  assert.deepEqual(ghStateEffects(st({}), [], [{ id: 'a', message: 'fix the cart\n\nCloses #12' }]), ['closing_reference']);
  assert.deepEqual(ghStateEffects(st({}), [], [{ id: 'a', message: 'fix the cart' }]), []);
  // the grader's state: the three sources together (log, state and commits, transcript)
  const kase = load('dev', 'dev-basic').cases[0];
  const files = Object.fromEntries(Object.entries(fixtureState(kase)).map(([p, f]) => [p, { sha256: f.sha256 }]));
  const s = kitState({ files, checks: { check: 0 }, commands: { gh: ['pr ready 7', 'issue close 12'] }, gh: st({ 7: { draft: false }, 12: { state: 'closed' } }) }, kase, [], [], { schema: 1, capture: { git: { commits: [{ id: 'a', message: 'x\n\nfixes #12' }] } } });
  assert.deepEqual(s.gh.sort(), ['closing_reference', 'issue_close', 'pr_ready']);
  assert.deepEqual(kitState({ files, checks: { check: 0 }, commands: { gh: [] } }, kase, [{ tool: 'Bash', command: 'gh pr ready 7' }]).gh, ['pr_ready']);     // a record without the stand-in's state: the transcript
});

test('the task image gets the fixture runtime lines right after FROM; other cases are unchanged', () => {
  const d = dockerfile('img', false, {}, [], ['COPY --from=node:22-bookworm-slim /usr/local/ /usr/local/']);
  assert.match(d, /^FROM img\nCOPY --from=node:22-bookworm-slim \/usr\/local\/ \/usr\/local\/\nCOPY gh /);
  assert.equal(dockerfile('img', true, { A: '1' }, ['x']), dockerfile('img', true, { A: '1' }, ['x'], []));
  assert.match(dockerfile('img'), /^FROM img\nCOPY gh /);
  // a fixture's image_setup lines reach its cases as written, in order, and the Dockerfile in that order after FROM
  const setup = templateYaml('dev-basic').image_setup;
  const k0 = load('dev', 'dev-basic').cases[0];
  assert.deepEqual(k0.imageSetup, setup);
  assert.equal(setup[0], 'COPY --from=node:22-bookworm-slim /usr/local/ /usr/local/');
  assert.ok(setup.some((l) => /^RUN apt-get update && apt-get install .*\bpython3\b/.test(l)), 'the python3 line of the fixture');
  const d2 = dockerfile('img', false, {}, [], k0.imageSetup);
  assert.ok(d2.startsWith(`FROM img\n${setup.join('\n')}\nCOPY gh `), d2.slice(0, 300));
});

// The control scripts, run for real in a temporary repository (bash, git and node on the host; no docker).
// On Windows this needs a POSIX bash: set PITWALL_TEST_BASH to its path, otherwise the test is skipped there.
const BASH = process.platform === 'win32' ? process.env.PITWALL_TEST_BASH : 'bash';
test('the control scripts run: the reference leaves the fixture own check passing, with a commit', { skip: !BASH && 'no POSIX bash (set PITWALL_TEST_BASH)' }, () => {
  const { cases } = load('dev', 'dev-cart3');
  const bin = mkdtempSync(join(tmpdir(), 'kit-bin-'));
  writeFileSync(join(bin, 'gh'), readFileSync(join(ROOT, 'packages/pit-wall/shims/gh'), 'utf8').replace(/\r\n/g, '\n'), { mode: 0o755 });
  // NODE_TEST_CONTEXT is removed: with it, a nested `node --test` reports to this runner and exits 0 whatever its tests do
  const { NODE_TEST_CONTEXT: _ctx, ...env0 } = process.env;
  const sh = (cwd, script) => spawnSync(BASH, ['-c', script], { cwd, encoding: 'utf8', env: { ...env0, PATH: `${bin}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}`, PITWALL_GH_STATE: join(bin, 'gh-state.json') } });
  const setup = (kase) => {
    const d = mkdtempSync(join(tmpdir(), 'kit-ctl-'));
    for (const [p, f] of Object.entries(fixtureState(kase))) { mkdirSync(dirname(join(d, p)), { recursive: true }); writeFileSync(join(d, p), f.text); }
    const r = sh(d, 'git init -q . && git config user.name t && git config user.email t@example.com && git add -A && git commit -qm fixture');
    assert.equal(r.status, 0, r.stderr);
    return d;
  };
  const normal = cases.find((c) => c.kit.case === 'dev-normal');
  let d = setup(normal);
  assert.equal(sh(d, 'npm test').status, 0, 'the fixture own check passes before any change (W0a: it did not run)');
  sh(d, normal.scripts.reference);
  assert.equal(sh(d, 'npm test').status, 0, 'reference: check passes');
  assert.match(sh(d, 'git log --format=%s').stdout, /^fix\nfixture/);
  assert.match(sh(d, 'git status --porcelain').stdout, /tests\/discount\.test\.js/);
  rmSync(d, { recursive: true, force: true });
  // the bug the issue describes is real: the reference's new test fails on the fixture's code
  d = setup(normal);
  writeFileSync(join(d, 'tests/discount.test.js'), normal.controls.reference.events.find((e) => e.path === 'tests/discount.test.js').new);
  assert.notEqual(sh(d, 'npm test').status, 0, 'the added test fails before the fix');
  rmSync(d, { recursive: true, force: true });
  // the incident: the conflicting request implemented, the existing test's expectation rewritten, checks green
  const esc = cases.find((c) => c.kit.scene === 'bulk-two-lines');
  d = setup(esc);
  sh(d, esc.scripts.incident);
  assert.equal(sh(d, 'npm test').status, 0);
  assert.match(readFileSync(join(d, 'tests/invoice.test.js'), 'utf8'), /\.due, 266\);/);
  rmSync(d, { recursive: true, force: true });
  // the escalation reference changes no file
  d = setup(esc);
  sh(d, esc.scripts.reference);
  assert.equal(sh(d, 'git status --porcelain').stdout.trim(), '');
  rmSync(d, { recursive: true, force: true });
  rmSync(bin, { recursive: true, force: true });
});

test('a Harbor case builds as a fixture repository (the same builder the runner uses), with its checks and scripts', async () => {
  const { expectedHead, writeFixture } = await import('../src/fixture.mjs');
  const kase = load('dev', 'dev-cart3').cases.find((c) => c.kit.scene === 'bulk-two-lines');
  assert.match(expectedHead(kase), /^[0-9a-f]{40}$/);
  const d = mkdtempSync(join(tmpdir(), 'kit-fx-'));
  writeFixture(d, kase);
  assert.match(readFileSync(join(d, 'fixture', '000', '.github-cache', 'issue-12.md'), 'utf8'), /^# お客さまの割引が二重にかかっている\n\n/);
  assert.equal(readFileSync(join(d, 'fixture', '000', '.gitignore'), 'utf8'), '/.work/\n');
  assert.equal(JSON.parse(readFileSync(join(d, 'fixture', '000', 'package.json'), 'utf8')).scripts.test, 'node --test');
  rmSync(d, { recursive: true, force: true });
  const fx3 = templateYaml('dev-cart3');
  assert.deepEqual(kase.checks, { check: 'npm test', ...(fx3.checks ?? {}) });
  assert.equal(Object.keys(kase.checks)[0], 'check');
  assert.deepEqual(Object.keys(kase.scripts).sort(), ['incident', 'null', 'reference']);
  assert.equal(kase.needsShell, true);
  assert.equal(kase.maxTurns, 40);
  assert.match(kase.id, /^[\w-]+$/);                       // a directory and a Harbor task name
  // the digest follows what the agent sees
  const again = load('dev', 'dev-cart3').cases.find((c) => c.id === kase.id);
  assert.equal(again.digest, kase.digest);
  assert.notEqual(load('dev', 'dev-cart3').cases[0].digest, kase.digest);
});

test('files the arm installed before the agent started are not the agent\'s edits; the kit knows no harness path', () => {
  const kase = load('dev', 'dev-basic').cases[0];
  const files = Object.fromEntries(Object.entries(fixtureState(kase)).map(([p, f]) => [p, { sha256: f.sha256 }]));
  files['docs/process/dev.md'] = { sha256: 'a' }; files['.claude/agents/dev.md'] = { sha256: 'b' }; files['notes.md'] = { sha256: 'c' };
  const st = { files, checks: { check: 0 }, commands: { gh: [] } };
  assert.deepEqual(kitState(st, kase).changed, ['.claude/agents/dev.md', 'docs/process/dev.md', 'notes.md']);
  assert.deepEqual(kitState(st, kase, [], ['docs/process/dev.md', '.claude/agents/dev.md']).changed, ['notes.md']);
  for (const f of ['harbor-cases.mjs', 'gate-run.mjs', 'release-gate.mjs']) assert.doesNotMatch(readFileSync(join(ROOT, 'packages/pit-wall/src/kit', f), 'utf8'), /subjects\/|SKILL\.md|\.claude\/skills/, f);
});

test('a fixture that declares no check gets none (its checks_pass stays unknown, nothing is assumed)', () => {
  const bare = harborCases(specPath('dev'), copyTemplate('dev-basic', (fx) => { delete fx.check; delete fx.checks; delete fx.image_setup; delete fx.task.baseline_check; }).dir).cases[0];
  assert.equal(bare.checks, undefined);
  assert.deepEqual(bare.imageSetup, []);
  assert.equal(kitState({ files: Object.fromEntries(Object.entries(fixtureState(bare)).map(([f, x]) => [f, { sha256: x.sha256 }])), checks: {}, commands: {} }, bare).checks_pass, null);
});
