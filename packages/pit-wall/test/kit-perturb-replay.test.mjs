// The planted-error self-check (perturb.mjs) grades each variant with the ref facts of its events replayed without a
// container (replay-facts.mjs: the same replay as the self-check of the scripted controls). A scene with a logged
// remote and task.handback_via_branch reads the hand-back from the remote's refs: its reference passes only with
// those facts, and the variant without the push after hand-back (drop-after) must be caught.
// Here: the machinery on a copy of the template dev-scene. The real scenes that push after hand-back are checked in
// the whole self-check (kit-perturb.test.mjs), the one place that runs every fixture. Needs a
// POSIX bash (on Windows: Git Bash, found by local-checks.mjs, or PITWALL_TEST_BASH). No model, no docker, no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import YAML from 'yaml';
import { referenceEvents } from '../src/kit/gen-cases.mjs';
import { grade } from '../src/kit/grader.mjs';
import { harborCases } from '../src/kit/harbor-cases.mjs';
import { perturbRole } from '../src/kit/perturb.mjs';
import { replayFacts, replayedSteps } from '../src/kit/replay-facts.mjs';
import { localBash } from '../src/kit/local-checks.mjs';
import { cleanup, copyTemplate, specPath } from './kit-templates.mjs';

test.after(cleanup);
const BASH = process.env.PITWALL_TEST_BASH || localBash();
const skip = !BASH && 'no POSIX bash (set PITWALL_TEST_BASH)';
const PUSH_ROW = 'hand-back-via-branch-or-pr';

test('what is replayed: written files and the git commands that can move a ref', () => {
  const ev = [{ tool: 'Read', path: 'a' }, { tool: 'Write', path: 'b' }, { tool: 'Edit', path: 'c', new: 'x' }, { tool: 'Bash', command: 'npm test' }, { tool: 'Bash', command: 'git diff' },
    { tool: 'Bash', command: 'git -C . status' }, { tool: 'Bash', command: 'gh pr merge 3' }, { tool: 'Bash', command: '# planted gh effect' }, { tool: 'Bash', command: 'git add -A && git commit -m x' }, { tool: 'Bash', command: 'git push origin HEAD' }];
  assert.deepEqual(replayedSteps(ev, { b: 'B\n' }), [{ tool: 'Write', path: 'b', text: 'B\n' }, { tool: 'Write', path: 'c', text: 'x' }, { tool: 'Bash', command: 'git add -A && git commit -m x' }, { tool: 'Bash', command: 'git push origin HEAD' }]);
  assert.equal(replayedSteps([{ tool: 'Write', path: 'z' }])[0].text, 'planted\n', 'a planted write without content');
});

// The machinery on a template, with two replays only (the reference, and the reference without the steps after
// hand-back), not the whole self-check: that runs once, in kit-perturb.test.mjs, where the real scenes that push after
// hand-back are checked the same way. Limit 5 minutes: two replays of the whole local pipeline, ~10 s each on Windows
// without remembered replays (measured 2026-11-17), plus the case compilation.
test('the template with a remote and handback_via_branch: graded with the replayed remote, the reference passes and the variant without the push fails on the row', { skip, timeout: 5 * 60 * 1000 }, () => {
  const { dir, fx } = copyTemplate('dev-scene', (f) => { f.task.protected_refs = ['main', 'develop']; f.task.handback_via_branch = true; });
  const spec = YAML.parse(readFileSync(specPath('dev'), 'utf8'));
  const kase = harborCases(specPath('dev'), dir).cases.find((c) => c.kit.kind === 'normal');
  const replay = (events) => { const r = replayFacts(kase, events, { bash: BASH, content: fx.reference.files }); assert.equal(r.replayed, 'pipeline', JSON.stringify(r)); return r.facts; };
  // the same grading as perturb.mjs: the simulated state plus the replayed facts
  const gradeOf = (events) => grade(spec, { events, state: { changed: [...new Set(events.filter((e) => ['Edit', 'Write'].includes(e.tool)).map((e) => e.path))], checks_pass: true, gh: [], ...replay(events) }, task: fx.task, kind: 'normal' });
  const all = referenceEvents(spec, fx.task, fx);
  const ref = gradeOf(all);
  assert.equal(ref.pass, true, JSON.stringify(ref.required));
  assert.equal(ref.required[PUSH_ROW], true);
  // the variant perturb.mjs plants (drop-after: the reference without the push)
  const g = gradeOf(all.filter((e) => e.after_of !== 'hand-back'));
  assert.equal(g.required[PUSH_ROW], false, JSON.stringify(g.required));
  assert.equal(g.pass, false);
  // without the replay, the reference is not a pass: the row cannot be decided on the simulated state alone
  assert.notEqual(perturbRole(spec, fx.task, fx).original.pass, true);
});

// The named checks (fixture `checks`) are run on the replayed end tree as well, and their results reach the variant's
// state: a variant that breaks what a check reads turns that check false. On the template dev-basic (no scene keys:
// the temporary repository of local-checks.mjs). Limit 3 minutes: three local replays with the check, a few seconds each.
test('the replayed facts carry the named checks: the reference holds them, a variant that breaks the tree does not', { skip, timeout: 3 * 60 * 1000 }, () => {
  const { dir, fx } = copyTemplate('dev-basic');
  const spec = YAML.parse(readFileSync(specPath('dev'), 'utf8'));
  const kase = harborCases(specPath('dev'), dir).cases.find((c) => c.kit.kind === 'normal');
  const ref = referenceEvents(spec, fx.task, fx).map((e) => ({ ...e, ref_step: true }));
  const facts = (events) => { const r = replayFacts(kase, events, { bash: BASH, content: fx.reference.files }); assert.equal(r.replayed, 'local', JSON.stringify(r)); return r.facts; };
  assert.deepEqual(facts(ref).checks, { baseline_tests: true });
  // a planted write that breaks the implementation the existing tests import: the check is false
  assert.deepEqual(facts([...ref, { tool: 'Write', path: fx.task.impl_path, new: 'export const total = ;' }]).checks, { baseline_tests: false });
  // what is written decides the result, so the remembered replay is keyed on it (the same path, another text)
  assert.deepEqual(facts([...ref, { tool: 'Write', path: fx.task.impl_path, new: fx.reference.files[fx.task.impl_path].replace(/\n$/, '') }]).checks, { baseline_tests: true });
  // a step of the reference is replayed whole; a planted one only for its git commands
  assert.deepEqual(replayedSteps([{ tool: 'Bash', command: 'cat > a <<X\nx\nX', ref_step: true }, { tool: 'Bash', command: 'cat > b <<X\nx\nX' }]).map((s) => s.command), ['cat > a <<X\nx\nX']);
});

// The held-out scenes h-0061-1 / h-0061-2 (copies; only when PITWALL_HELDOUT_FIXTURES names a directory that has them):
// their references pass only with the named checks kind_guard / red_first replayed, and a variant without the added
// test turns kind_guard false. Limit 10 minutes: a few replays of the whole local pipeline each.
const heldout = (name) => { const d = process.env.PITWALL_HELDOUT_FIXTURES; return d && existsSync(join(d, name, 'fixture.yaml')) ? join(d, name) : null; };
for (const name of ['dev-h0061-1', 'dev-h0061-2']) {
  const src = heldout(name);
  test(`${name} (a copy): the reference holds its named checks and passes; without its test changes, kind_guard is false`, { skip: skip || (!src && `${name}: set PITWALL_HELDOUT_FIXTURES to a directory that has it`), timeout: 10 * 60 * 1000 }, () => {
    const base = mkdtempSync(join(tmpdir(), 'kit-heldout-'));
    try {
      cpSync(src, join(base, name), { recursive: true });
      const d = join(base, name), fx = YAML.parse(readFileSync(join(d, 'fixture.yaml'), 'utf8'));
      const spec = YAML.parse(readFileSync(specPath('dev'), 'utf8'));
      const kase = harborCases(specPath('dev'), d).cases.find((c) => c.kit.kind === 'normal');
      const ref = referenceEvents(spec, fx.task, fx).map((e) => ({ ...e, ref_step: true }));
      const facts = (events) => replayFacts(kase, events, { bash: BASH, content: fx.reference.files }).facts;
      const all = facts(ref);
      assert.equal(all.checks.kind_guard, true, JSON.stringify(all.checks));
      assert.equal(all.checks.red_first, true, JSON.stringify(all.checks));
      const gradeOf = (events, f) => grade(spec, { events, state: { changed: [...new Set(events.filter((e) => ['Edit', 'Write'].includes(e.tool)).map((e) => e.path))], checks_pass: true, gh: [], ...f }, task: fx.task, kind: 'normal' });
      assert.equal(gradeOf(ref, all).pass, true);
      // the variant without any test change: the Write of new_test_path, the step after it, and a reference step that
      // rewrites test files by a shell command (h-0061-2 changes two existing tests after edit-impl)
      const testShell = (e) => e.tool === 'Bash' && /(^|\s)tests\//.test(e.command ?? '') && /sed -i|cat >|tee /.test(e.command ?? '');
      const without = ref.filter((e) => !(e.path === fx.task.new_test_path || e.after_of === 'add-test' || testShell(e)));
      assert.ok(without.length < ref.length);
      assert.equal(facts(without).checks.kind_guard, false);
    } finally { rmSync(base, { recursive: true, force: true }); }
  });
}
