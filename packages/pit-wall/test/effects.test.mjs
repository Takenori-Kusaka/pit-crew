// Judging by effects: marked runs of documented commands, the end state carrying the gh
// state and the runs (state-capture.sh -> readState), and checks with three outcomes
// (exit 2 = undecidable, reported and never scored as a failure).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';
import { PRELUDE, RUNNERS, shell } from './shell-helpers.mjs';
import { EMPTY_GH_STATE, ranOnFinal, readState } from '../src/runners/harbor.mjs';
import { grade, runPassed } from '../src/graders/index.mjs';
import { classify } from '../src/graders/state.mjs';
import { buildCase } from '../src/patterns/index.mjs';
import { FAULTS, markUndecidable } from '../src/validity.mjs';
import { renderReport, summarize } from '../src/report.mjs';

const empty = { steps: [], final_message: '' };

test('a marked documented command is recorded however it is invoked, with its exit code', () => {
  const { stdout } = shell(`${PRELUDE}
d=$(mktemp -d); cd "$d"; export PITWALL_RUNS_LOG="$d/runs.log"
mkdir -p tools sub
cat > tools/check <<'X'
#!/bin/sh
trap 'pitwall-mark-run check $?' EXIT
exit \${CHECK_EXIT:-0}
X
cat > tools/test <<'X'
#!/bin/sh
exec pitwall-mark-run test -- sh -c 'exit \${TEST_EXIT:-0}'
X
chmod +x tools/check tools/test
printf 'check:\\n\\t./tools/check\\n' > Makefile
printf '#!/bin/bash\\n./tools/check\\n' > ci.sh
codes=
./tools/check; codes="$codes $?"
bash tools/check; codes="$codes $?"
sh tools/check; codes="$codes $?"
make -s check; codes="$codes $?"
(cd sub && ../tools/check); codes="$codes $?"
bash ci.sh; codes="$codes $?"
CHECK_EXIT=1 sh tools/check; codes="$codes $?"
./tools/test; codes="$codes $?"
TEST_EXIT=3 bash tools/test; codes="$codes $?"
pitwall-mark-run manual 7; codes="$codes $?"
echo "CODES$codes"
cut -f1,3 runs.log
awk -F'\\t' '$2 !~ /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z$/ {print "BADTS", $0}' runs.log`);
  // Exit codes pass through unchanged.
  assert.match(stdout, /^CODES 0 0 0 0 0 0 1 0 3 7$/m);
  const rows = stdout.split('\n').filter((l) => /^(check|test|manual)\t/.test(l));
  assert.deepEqual(rows, ['check\t0', 'check\t0', 'check\t0', 'check\t0', 'check\t0', 'check\t0', 'check\t1', 'test\t0', 'test\t3', 'manual\t7']);
  assert.doesNotMatch(stdout, /BADTS/);
});

test('state-capture carries the gh state, the unparsed calls and the runs; checks do not write into them', () => {
  const { stdout, dir } = shell((sd) => `${PRELUDE}
T=${sd}/cap; mkdir -p "$T/app" "$T/logs" "$T/tests"
sed -e 's|/tmp/pitwall-|'"$T"'/pitwall-|g' -e 's|/app|'"$T"'/app|g' -e 's|/logs/verifier|'"$T"'/logs|g' -e 's|/tests/checks.sh|'"$T"'/tests/checks.sh|g' \\
  '${RUNNERS}/state-capture.sh' | tr -d '\\r' > "$T/capture.sh"
cd "$T/app" && git init -q . && echo x > f && git add f && git -c user.name=a -c user.email=a@e commit -qm f
# The agent's turn.
( export PITWALL_GH_STATE="$T/pitwall-gh-state.json" PITWALL_RUNS_LOG="$T/pitwall-runs.log"
  gh issue edit 12 --add-label needs-po >/dev/null; gh frobnicate >/dev/null; pitwall-mark-run check 0 )
# The checks: read the agent's effects, and make calls of their own.
cat > "$T/tests/checks.sh" <<X
#!/bin/bash
grep -qxF \\$'item\\t12\\tlabel\\tneeds-po' "$T/pitwall-gh-state.tsv"; printf 'labelled\\t%s\\n' "\\$?"
gh issue edit 99 --add-label from-check >/dev/null; pitwall-mark-run from-check 0
cut -f1 "$T/pitwall-runs.log" | grep -qx check; printf 'ran\\t%s\\n' "\\$?"
exit 0
X
bash "$T/capture.sh"
echo DONE`);
  assert.match(stdout, /DONE/);
  const st = readState(join(dir, 'cap', 'logs', 'state.json'));
  assert.deepEqual(st.gh, { items: { 12: { labelsAdded: ['needs-po'] } }, created: { pullRequests: [], issues: [] } });
  assert.deepEqual(st.ghUnparsed, [{ reason: 'unknown subcommand', call: 'frobnicate' }]);
  assert.deepEqual(st.runs.map((r) => [r.name, r.code]), [['check', 0]]);
  assert.deepEqual(st.checks, { labelled: 0, ran: 0 });
});

// --- ran on the final tree --------------------------------------------------------------
// Each block prints "<label> <value>"; ROF = pitwall-ran-on-final's exit code.
test('a run counts as on the final tree only if nothing changed after it, and it passed', () => {
  const { stdout } = shell(`${PRELUDE}
newrepo() { d=$(mktemp -d); cd "$d"; git init -q .; mkdir -p sub; echo a > f; echo s > sub/g; printf '*.ig\\nbuild/\\n' > .gitignore
  git add -A; git -c user.name=a -c user.email=a@e commit -qm init; export PITWALL_RUNS_LOG="$d/../runs-$(basename "$d").log" PITWALL_AGENT_RUNS_LOG="$d/../runs-$(basename "$d").log"; }
rof() { pitwall-ran-on-final "$@"; echo "$1:$?"; }
# run -> edit -> no rerun: not on the final tree.
newrepo; pitwall-mark-run check 0; echo b >> f; echo "edit-no-rerun $(rof check)"
# run -> edit -> rerun that passes: on the final tree.
newrepo; pitwall-mark-run check 0; echo b >> f; pitwall-mark-run check -- true; echo "edit-rerun-pass $(rof check)"
# run -> edit -> rerun that fails: not passing on the final tree.
newrepo; pitwall-mark-run check 0; echo b >> f; pitwall-mark-run check -- false; echo "edit-rerun-fail $(rof check)"
# Editing back to the same content is the same tree.
newrepo; pitwall-mark-run check 0; echo b >> f; echo a > f; echo "edit-revert $(rof check)"
# Another command's run does not count; neither does no run at all.
newrepo; pitwall-mark-run lint 0; echo "other-name $(rof check)"
# Run from a subdirectory: the same hash as from the root, and on the final tree.
newrepo; (cd sub && pitwall-mark-run check 0); echo "subdir $(rof check)"
echo "subdir-tree-same $([ "$(cut -f4 "$PITWALL_RUNS_LOG")" = "$(pitwall-mark-run --tree)" ] && echo yes || echo no)"
# A clean checkout hashes to HEAD's tree.
echo "clean-is-head $([ "$(pitwall-mark-run --tree)" = "$(git rev-parse 'HEAD^{tree}')" ] && echo yes || echo no)"
# An untracked new file changes the hash; an ignored one does not.
newrepo; t0=$(pitwall-mark-run --tree); echo x > new.txt; t1=$(pitwall-mark-run --tree)
mkdir -p build; echo y > build/out; echo z > a.ig; t2=$(pitwall-mark-run --tree)
echo "untracked-changes $([ "$t0" != "$t1" ] && echo yes || echo no)"
echo "ignored-same $([ "$t1" = "$t2" ] && echo yes || echo no)"
# A deleted tracked file changes it; a tracked file that matches an ignore rule still counts.
newrepo; t0=$(pitwall-mark-run --tree); rm sub/g; t1=$(pitwall-mark-run --tree); echo "delete-changes $([ "$t0" != "$t1" ] && echo yes || echo no)"
newrepo; echo k > keep.ig; git add -f keep.ig; git -c user.name=a -c user.email=a@e commit -qm k; t0=$(pitwall-mark-run --tree); echo k2 > keep.ig; t1=$(pitwall-mark-run --tree)
echo "tracked-ignored-counts $([ "$t0" != "$t1" ] && echo yes || echo no)"
# The real index and the object store are unchanged by mark-run; staged changes stay staged.
newrepo; echo c > f; git add f; echo u > untracked.txt; echo w >> sub/g
i0=$(sha256sum .git/index); s0=$(git status --porcelain); o0=$(find .git/objects -type f | sort | sha256sum)
pitwall-mark-run check 0; pitwall-mark-run --tree >/dev/null
i1=$(sha256sum .git/index); s1=$(git status --porcelain); o1=$(find .git/objects -type f | sort | sha256sum)
echo "index-unchanged $([ "$i0" = "$i1" ] && [ "$s0" = "$s1" ] && echo yes || echo no)"
echo "objects-unchanged $([ "$o0" = "$o1" ] && echo yes || echo no)"
echo "no-temp-left $(ls -d /tmp/tmp.* 2>/dev/null | while read -r x; do [ -d "$x/objects" ] && echo "$x"; done | wc -l)"
echo "staged-tree-is-worktree $([ "$(cut -f4 "$PITWALL_RUNS_LOG")" != "$(git write-tree)" ] && echo yes || echo no)"
# Undecidable: no git repository (no tree recorded, none to compare with).
d=$(mktemp -d); cd "$d"; export PITWALL_RUNS_LOG="$d/runs.log" PITWALL_AGENT_RUNS_LOG="$d/runs.log"
pitwall-mark-run check 0; echo "nogit-tree [$(cut -f4 runs.log)] $(awk -F'\\t' '{print NF}' runs.log)"
echo "nogit $(rof check)"; echo "nogit-tree-mode $(pitwall-mark-run --tree; echo $?)"
# Undecidable: final tree known, but the passing run has no tree (e.g. a log from before trees).
newrepo; printf 'check\\t2026-01-01T00:00:00Z\\t0\\n' > "$PITWALL_RUNS_LOG"; echo "old-log $(rof check)"
printf 'check\\t2026-01-01T00:00:00Z\\t1\\n' > "$PITWALL_RUNS_LOG"; echo "old-log-failed $(rof check)"
# The final tree from the environment (state-capture) wins; set but empty = unknown.
newrepo; pitwall-mark-run check 0; echo "env-final-other $(PITWALL_FINAL_TREE=0000 rof check)"; echo "env-final-empty $(PITWALL_FINAL_TREE= rof check)"
echo "no-log $(PITWALL_AGENT_RUNS_LOG=/nonexistent rof check)"
`);
  const got = Object.fromEntries(stdout.split('\n').filter(Boolean).map((l) => { const i = l.indexOf(' '); return [l.slice(0, i), l.slice(i + 1)]; }));
  const want = {
    'edit-no-rerun': 'check:1', 'edit-rerun-pass': 'check:0', 'edit-rerun-fail': 'check:1', 'edit-revert': 'check:0', 'other-name': 'check:1',
    subdir: 'check:0', 'subdir-tree-same': 'yes', 'clean-is-head': 'yes', 'untracked-changes': 'yes', 'ignored-same': 'yes',
    'delete-changes': 'yes', 'tracked-ignored-counts': 'yes', 'index-unchanged': 'yes', 'objects-unchanged': 'yes', 'no-temp-left': '0',
    'staged-tree-is-worktree': 'yes', 'nogit-tree': '[] 4', nogit: 'check:2', 'nogit-tree-mode': '2', 'old-log': 'check:2', 'old-log-failed': 'check:1',
    'env-final-other': 'check:1', 'env-final-empty': 'check:2', 'no-log': 'check:1',
  };
  for (const [k, v] of Object.entries(want)) assert.equal(got[k], v, `${k}: got ${got[k]}`);
});

test('state-capture records the final tree as mark-run hashes it; readState and ranOnFinal read it; checks can ask', () => {
  const { dir } = shell((sd) => `${PRELUDE}
T=${sd}/cap; mkdir -p "$T/app" "$T/logs" "$T/tests"
sed -e 's|/tmp/pitwall-|'"$T"'/pitwall-|g' -e 's|/app|'"$T"'/app|g' -e 's|/logs/verifier|'"$T"'/logs|g' -e 's|/tests/checks.sh|'"$T"'/tests/checks.sh|g' \\
  '${RUNNERS}/state-capture.sh' | tr -d '\\r' > "$T/capture.sh"
cd "$T/app" && git init -q . && echo x > f && git add f && git -c user.name=a -c user.email=a@e commit -qm f
# The agent: tests pass, edits, tests pass again; lint passes, then an edit after it.
( export PITWALL_RUNS_LOG="$T/pitwall-runs.log"
  pitwall-mark-run test 0; echo y >> f; pitwall-mark-run test -- true; pitwall-mark-run lint 0; echo new > g.txt )
pitwall-mark-run --tree > "$T/expected-final"
# The checks: ask, then change the tree and run the command themselves (must not count).
cat > "$T/tests/checks.sh" <<'X'
#!/bin/bash
pitwall-ran-on-final test; printf 'test-on-final\\t%s\\n' "$?"
pitwall-ran-on-final lint; printf 'lint-on-final\\t%s\\n' "$?"
echo z > late.txt; pitwall-mark-run lint 0
pitwall-ran-on-final lint; printf 'lint-after-check-run\\t%s\\n' "$?"
exit 0
X
bash "$T/capture.sh"`);
  const st = readState(join(dir, 'cap', 'logs', 'state.json'));
  const expected = readFileSync(join(dir, 'cap', 'expected-final'), 'utf8').trim();
  assert.match(expected, /^[0-9a-f]{40,64}$/);
  assert.equal(st.finalTree, expected, 'state-capture hashes the tree as mark-run does');
  assert.deepEqual(st.runs.map((r) => [r.name, r.code, r.tree === st.finalTree]), [['test', 0, false], ['test', 0, false], ['lint', 0, false]]);
  for (const r of st.runs) { assert.match(r.ts, /^\d{4}-\d\d-\d\dT[\d:.]+Z$/); assert.match(r.tree, /^[0-9a-f]{40,64}$/); }
  assert.equal(st.runs[0].tree === st.runs[1].tree, false, 'the edit between the two test runs changed the tree');
  assert.equal(st.runs[1].tree, st.runs[2].tree);
  // g.txt was added after every run: nothing ran on the final tree.
  assert.equal(ranOnFinal({ state: st }, 'test'), false);
  assert.equal(ranOnFinal(st, 'lint'), false);
  assert.deepEqual(st.checks, { 'test-on-final': 1, 'lint-on-final': 1, 'lint-after-check-run': 1 });
});

test('ranOnFinal: true / false / null as the shell helper answers', () => {
  const run = (name, code, tree) => ({ name, ts: 't', code, tree });
  const st = (runs, finalTree = 'F') => ({ state: { runs, finalTree } });
  assert.equal(ranOnFinal(st([run('check', 0, 'A'), run('check', 0, 'F')]), 'check'), true);
  assert.equal(ranOnFinal(st([run('check', 0, 'F'), run('check', 1, 'F')]), 'check'), true, 'some passing run on the final tree');
  assert.equal(ranOnFinal(st([run('check', 0, 'A')]), 'check'), false, 'edited after the run');
  assert.equal(ranOnFinal(st([run('check', 0, 'A'), run('check', 1, 'F')]), 'check'), false, 'the rerun failed');
  assert.equal(ranOnFinal(st([run('lint', 0, 'F')]), 'check'), false, 'another command');
  assert.equal(ranOnFinal(st([]), 'check'), false, 'never ran');
  assert.equal(ranOnFinal(st([run('check', 0, null)]), 'check'), null, 'a passing run without a tree');
  assert.equal(ranOnFinal(st([run('check', 1, null)]), 'check'), false, 'only a failing run without a tree');
  assert.equal(ranOnFinal(st([run('check', 0, null), run('check', 0, 'F')]), 'check'), true);
  assert.equal(ranOnFinal(st([run('check', 0, 'F')], null), 'check'), null, 'final tree unknown');
  assert.equal(ranOnFinal({ state: { runs: null, finalTree: 'F' } }, 'check'), null, 'runs not captured');
  assert.equal(ranOnFinal({ state: null }, 'check'), null, 'no state');
});

test('readState: a capture without gh state or runs gives null; an empty capture gives the empty state', () => {
  const d = mkdtempSync(join(tmpdir(), 'pitwall-rs-'));
  const base = { files: {}, git: { head: 'h', fixtureHead: 'h', fixtureIntact: true, log_b64: '' }, checks_b64: '', oomKills: 0 };
  writeFileSync(join(d, 'old.json'), JSON.stringify({ ...base, commands: { gh_b64: '' } }));
  writeFileSync(join(d, 'new.json'), JSON.stringify({ ...base, commands: { gh_b64: '', gh_state_b64: '', gh_unparsed_b64: '' }, runs_b64: '' }));
  const old = readState(join(d, 'old.json'));
  assert.equal(old.gh, null); assert.equal(old.runs, null); assert.equal(old.ghUnparsed, null);
  const neu = readState(join(d, 'new.json'));
  assert.deepEqual(neu.gh, EMPTY_GH_STATE); assert.deepEqual(neu.runs, []); assert.deepEqual(neu.ghUnparsed, []);
});

// --- three outcomes --------------------------------------------------------------------
const kase = buildCase('convention-adherence', {
  request: 'do it',
  history: [{ date: '2026-01-01T00:00:00+00:00', message: 'init', files: { 'a.txt': 'a' } }],
  expect: { task: { name: 'task', check: 'true' }, conventions: [{ name: 'ran-check', check: 'x', tristate: true }, { name: 'memo', check: 'y' }] },
});
const state = (checks) => ({ files: {}, git: { fixtureIntact: true, fixtureHead: null, log: [] }, checks });
const gradeWith = (checks) => grade(empty, kase.graders, { state: state(checks), fixture: {} });

test('a tristate check that exits 2 is undecidable, not failed; a plain check that exits 2 still fails', () => {
  const r = gradeWith({ task: 0, 'ran-check': 2, memo: 2 });
  const by = Object.fromEntries(r.map((x) => [x.name, x]));
  assert.equal(by['ran-check'].passed, null);
  assert.equal(by['ran-check'].undecidable, true);
  assert.equal(by.memo.passed, false, 'not declared tristate: exit 2 keeps its old meaning');
  assert.equal(gradeWith({ task: 0, 'ran-check': 1, memo: 0 }).find((x) => x.name === 'ran-check').passed, false);
  assert.equal(gradeWith({ task: 0, 'ran-check': 0, memo: 0 }).find((x) => x.name === 'ran-check').passed, true);
});

test('undecidable runs are neither passes nor failures', () => {
  assert.equal(runPassed(gradeWith({ task: 0, 'ran-check': 2, memo: 0 }), 'protocol'), null);
  assert.equal(runPassed(gradeWith({ task: 0, 'ran-check': 2, memo: 1 }), 'protocol'), false, 'a decided failure stays a failure');
  assert.equal(runPassed(gradeWith({ task: 0, 'ran-check': 0, memo: 0 }), 'protocol'), true);
  // Outcomes: a rule that might hold makes the outcome undecidable; one that cannot hold is skipped.
  assert.equal(classify(gradeWith({ task: 0, 'ran-check': 2, memo: 0 }), kase.outcomes), 'undecidable');
  assert.equal(classify(gradeWith({ task: 0, 'ran-check': 2, memo: 1 }), kase.outcomes), 'some-followed');
  assert.equal(classify(gradeWith({ task: 1, 'ran-check': 2, memo: 0 }), kase.outcomes), 'task-failed');
  assert.equal(classify(gradeWith({ task: 0, 'ran-check': 0, memo: 0 }), kase.outcomes), 'all-followed');
});

test('an undecidable check marks the run suspect (check-undecidable), never better than it was', () => {
  assert.equal(FAULTS['check-undecidable'], 'suspect');
  const results = gradeWith({ task: 0, 'ran-check': 2, memo: 0 });
  const ok = markUndecidable({ status: 'ok', faults: [] }, results);
  assert.equal(ok.status, 'suspect');
  assert.deepEqual(ok.faults, [{ kind: 'check-undecidable', evidence: 'ran-check' }]);
  assert.equal(markUndecidable({ status: 'invalid', faults: [] }, results).status, 'invalid');
  assert.equal(markUndecidable({ status: 'ok', faults: [] }, gradeWith({ task: 0, 'ran-check': 0, memo: 0 })).status, 'ok');
});

test('the report counts undecidable runs apart from passes and failures', () => {
  const rec = (passed, faults = []) => ({ case: 'c', arm: 'a', trial: 1, passed, passedBy: { protocol: passed }, results: [], validity: { status: faults.length ? 'suspect' : 'ok', faults } });
  const doc = { suite: 's', runner: 'harbor', createdAt: 'now', records: [rec(true), rec(false), rec(null, [{ kind: 'check-undecidable', evidence: 'ran-check' }])] };
  const s = summarize(doc);
  const x = s.dims.overall.rows[0].arms.a;
  assert.deepEqual([x.k, x.n, x.undecided], [1, 2, 1]);
  assert.deepEqual(s.validity['c\u0000a'], { ok: 2, suspect: 1, invalid: 0 });
  const text = renderReport(s);
  assert.match(text, /1\/2 \(50%;.*\) \+ 1 undecidable/);
  assert.match(text, /1 run\(s\) had a check that could not decide/);
});

test('tristate is opt-in: cells that do not declare it build the same graders as before', () => {
  const plain = buildCase('convention-adherence', { request: 'r', history: [], expect: { task: { name: 't', check: 'true' }, conventions: [{ name: 'c', check: 'x' }] } });
  for (const g of plain.graders.filter((g) => g.type === 'state-check')) assert.equal('tristate' in g.params, false);
});
