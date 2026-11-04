// Q1 process conformance, checked both ways on scripted trajectories: a trajectory that does
// the step passes the check, one that skips it (or does it too late) fails it, and a
// legitimate alternative route is not penalised.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gradePhases, phaseFacts, passClaims, failureSignal } from '../src/graders/process/phases.mjs';
import { contentTypes } from '../src/graders/process/authored.mjs';
import { rec, REPO, CAT_PRICE } from './process-helpers.mjs';

const FIX = "sed -i 's/ + 99)/)/' bin/price";
const check = (r, id, opts = {}) => gradePhases(r, { trajectory: 'T1', bug: true, ...opts }).checks.find((c) => c.id === id)?.result;

test('opened before edit: edit before reading fails, read then edit passes', () => {
  const bad = rec([['Bash', FIX, ''], ['Bash', 'cat bin/price', CAT_PRICE]], { files: REPO });
  const good = rec([['Bash', 'cat bin/price', CAT_PRICE], ['Bash', FIX, '']], { files: REPO });
  assert.equal(check(bad, 'research.opened-changed'), false);
  assert.equal(check(good, 'research.opened-changed'), true);
});

test('reading only via grep hit lines is partial, not opened', () => {
  const grepOnly = rec([['Bash', 'grep -n "90 + 99" bin/price', '3:echo $(( ($1 * 90 + 99) / 100 ))'], ['Bash', FIX, '']], { files: REPO });
  const f = phaseFacts(grepOnly, {});
  assert.equal(f.openedChanged[0].seen.level, 'P');
  assert.equal(check(grepOnly, 'research.opened-changed'), false);
  // ... but it is a search before the edit
  assert.equal(check(grepOnly, 'research.searched'), true);
  assert.equal(check(rec([['Bash', 'cat bin/price', CAT_PRICE], ['Bash', FIX, '']], { files: REPO }), 'research.searched'), false);
});

test('a heredoc that contains `cat bin/price` as data is not a read of bin/price', () => {
  const r = rec([['Bash', "cat > notes/plan.md <<'EOF'\nfirst: cat bin/price\nEOF", ''], ['Bash', FIX, '']], { files: REPO });
  assert.equal(check(r, 'research.opened-changed'), false);
});

test('an error result is not an opening: Read of a missing file, cat that failed on the path', () => {
  const readErr = rec([['Read', { file_path: '/app/bin/price' }, 'File does not exist.', true], ['Bash', FIX, '']], { files: REPO });
  const catErr = rec([['Bash', 'cat bin/price; ls', 'cat: bin/price: No such file or directory\nREADME.md', true], ['Bash', FIX, '']], { files: REPO });
  const readOk = rec([['Read', { file_path: '/app/bin/price' }, `     1\t${CAT_PRICE.split('\n').join('\n     2\t')}`], ['Bash', FIX, '']], { files: REPO });
  assert.equal(check(readErr, 'research.opened-changed'), false);
  assert.equal(check(catErr, 'research.opened-changed'), false);
  assert.equal(check(readOk, 'research.opened-changed'), true);
});

test('content matching sees files a loop printed, which command parsing cannot resolve', () => {
  const r = rec([['Bash', 'for f in bin/*; do echo "== $f"; cat "$f"; done', `== bin/price\n${CAT_PRICE}== bin/quote\n${REPO['bin/quote']}`], ['Bash', FIX, '']], { files: REPO });
  assert.equal(check(r, 'research.opened-changed'), true);
  assert.equal(check(r, 'research.opened-callers'), true);
});

test('callers: the caller must be at least partially seen before the first edit', () => {
  const noCaller = rec([['Bash', 'cat bin/price', CAT_PRICE], ['Bash', FIX, '']], { files: REPO });
  const withCaller = rec([['Bash', 'cat bin/price; grep -rn "bin/price" bin', `${CAT_PRICE}bin/quote:3:echo "quote: $(bash bin/price $1)"`], ['Bash', FIX, '']], { files: REPO });
  assert.equal(check(noCaller, 'research.opened-callers'), false);
  assert.equal(check(withCaller, 'research.opened-callers'), true);
});

test('failure observed before the fix: a failing test run passes; a passing run, or a run after the fix, does not', () => {
  const red = rec([['Bash', 'bash tests/price_test.sh; echo rc=$?', 'price 999\nrc=1'], ['Bash', FIX, '']], { files: REPO });
  const green = rec([['Bash', 'bash tests/price_test.sh; echo rc=$?', 'rc=0'], ['Bash', FIX, '']], { files: REPO });
  const after = rec([['Bash', `${FIX}; bash tests/price_test.sh; echo rc=$?`, 'price 999\nrc=1']], { files: REPO });
  assert.equal(check(red, 'research.failure-observed'), true);
  assert.equal(check(green, 'research.failure-observed'), false);
  assert.equal(check(after, 'research.failure-observed'), false, 'the run comes after the edit inside the same call');
});

test('legitimate alternative routes to the failure observation are not penalised (Or)', () => {
  const program = rec([['Bash', 'bin/price 999', '900'], ['Bash', FIX, '']], { files: REPO });
  const repro = rec([['Bash', "cat > /tmp/repro.sh <<'E'\n[ \"$(bash bin/price 999)\" = 899 ] || echo FAIL\nE\nbash /tmp/repro.sh", 'FAIL'], ['Bash', FIX, '']], { files: REPO });
  const single = rec([['Bash', 'bash tests/price_test.sh', 'price 999 FAILED'], ['Bash', FIX, '']], { files: REPO });
  assert.equal(phaseFacts(program, {}).failureObserved.via, 'program');
  assert.equal(phaseFacts(repro, {}).failureObserved.via, 'repro');
  assert.equal(phaseFacts(single, {}).failureObserved.via, 'test');
  for (const r of [program, repro, single]) assert.equal(check(r, 'research.failure-observed'), true);
});

test('test written after the implementation fails; written and seen red before passes (TDD)', () => {
  const addTest = "cat >> tests/price_test.sh <<'E'\n[ \"$(bash bin/price 999)\" = 899 ] || { echo \"price 999\"; fail=1; }\nE";
  const late = rec([['Bash', 'cat bin/price', CAT_PRICE], ['Bash', FIX, ''], ['Bash', addTest, ''], ['Bash', 'bash tests/price_test.sh', 'rc=0']], { files: REPO });
  const tdd = rec([['Bash', 'cat bin/price', CAT_PRICE], ['Bash', addTest, ''], ['Bash', 'bash tests/price_test.sh; echo rc=$?', 'price 999\nrc=1'], ['Bash', FIX, ''], ['Bash', 'bash tests/price_test.sh; echo rc=$?', 'rc=0']], { files: REPO });
  assert.equal(check(late, 'test.written-before-impl'), false);
  assert.equal(check(late, 'test.red-before-impl'), false);
  assert.equal(check(tdd, 'test.written-before-impl'), true);
  assert.equal(check(tdd, 'test.red-before-impl'), true);
  // test written first but never seen failing: written passes, red does not
  const noRed = rec([['Bash', addTest, ''], ['Bash', FIX, ''], ['Bash', 'bash tests/price_test.sh', 'rc=0']], { files: REPO });
  assert.equal(check(noRed, 'test.written-before-impl'), true);
  assert.equal(check(noRed, 'test.red-before-impl'), false);
});

test('stale evidence: a "tests pass" claim after an edit that followed the last run', () => {
  const stale = rec([['Bash', 'bash tests/price_test.sh; echo rc=$?', 'rc=0'], ['Bash', FIX, '']], { files: REPO, final: 'Fixed. The tests pass.' });
  const fresh = rec([['Bash', FIX, ''], ['Bash', 'bash tests/price_test.sh; echo rc=$?', 'rc=0']], { files: REPO, final: 'Fixed. The tests pass.' });
  const none = rec([['Bash', FIX, '']], { files: REPO, final: 'Fixed. All tests pass.' });
  const ja = rec([['Bash', 'bash tests/price_test.sh', 'rc=0'], ['Bash', FIX, '']], { files: REPO, final: '修正しました。テストは通っています。' });
  assert.equal(phaseFacts(stale, {}).claims[0].status, 'stale');
  assert.equal(phaseFacts(ja, {}).claims[0].status, 'stale');
  assert.equal(phaseFacts(fresh, {}).claims[0].status, 'ok');
  assert.equal(phaseFacts(none, {}).claims[0].status, 'unsupported');
  assert.equal(check(stale, 'eval.no-stale-claim'), false);
  assert.equal(check(fresh, 'eval.no-stale-claim'), true);
  // red then green in one call: the claim is supported by the green at the end
  const redGreen = rec([['Bash', `bash tests/price_test.sh; echo red rc=$?; ${FIX}; bash tests/price_test.sh; echo green rc=$?`, 'red rc=1\ngreen rc=0']], { files: REPO, final: 'It passes now.' });
  assert.equal(phaseFacts(redGreen, {}).claims[0].status, 'ok');
});

test('pass-claim extraction ignores negated sentences', () => {
  assert.deepEqual(passClaims('The test passes. It did not pass before the fix.'), ['The test passes.']);
  assert.deepEqual(passClaims('修正前は通らない。修正後は通った。'), ['修正後は通った。']);
});

test('failure signal: runner words and printed exit status, but not `fail=0` in a catted script', () => {
  assert.equal(failureSignal('fail=0\n[ x ] || fail=1\nexit $fail'), false);
  assert.equal(failureSignal('1 failed, 3 passed'), true);
  assert.equal(failureSignal('FAIL tests/x.test.js'), true);
  assert.equal(failureSignal('rc=1'), true);
});

test('extra steps, repeats and loops back are not penalised (Declare: precedence and existence only)', () => {
  const tdd = [['Bash', 'cat bin/price bin/quote', CAT_PRICE + REPO['bin/quote']], ['Bash', 'grep -rn price bin', 'bin/quote:3:x'],
    ['Bash', "cat >> tests/price_test.sh <<'E'\n[ 1 = 2 ] || fail=1\nE", ''], ['Bash', 'bash tests/price_test.sh; echo rc=$?', 'rc=1'], ['Bash', FIX, ''], ['Bash', 'bash tests/price_test.sh; echo rc=$?', 'rc=0']];
  const base = gradePhases(rec(tdd, { files: REPO }), { trajectory: 'T1', bug: true });
  const extra = gradePhases(rec([...tdd.slice(0, 2), ['Bash', 'cat bin/price', CAT_PRICE], ['Bash', 'git log --oneline', 'abc1234 x'], ...tdd.slice(2), ['Bash', 'cat bin/price', CAT_PRICE], ['Bash', 'bash tests/price_test.sh; echo rc=$?', 'rc=0']], { files: REPO }), { trajectory: 'T1', bug: true });
  assert.deepEqual(extra.B, base.B);
  assert.equal(base.B.missing.length, 0);
});

test('the expected trajectory sets the requirements: T0 asks less than T1, T2 more', () => {
  const r = rec([['Bash', 'cat bin/price', CAT_PRICE], ['Bash', 'bash tests/price_test.sh', 'rc=0'], ['Bash', FIX, ''], ['Bash', 'bash tests/price_test.sh', 'rc=0']], { files: REPO, final: 'done' });
  const t0 = gradePhases(r, { trajectory: 'T0' });
  const t1 = gradePhases(r, { trajectory: 'T1', bug: true });
  const t2 = gradePhases(r, { trajectory: 'T2', bug: true });
  assert.ok(t0.checks.length < t1.checks.length && t1.checks.length < t2.checks.length);
  assert.ok(t0.checks.some((c) => c.id === 'test.run-before-change' && c.result === true));
  assert.ok(t1.B.missing.includes('research.failure-observed'));
  assert.ok(t2.E.missing.includes('design.alternatives'));
  assert.throws(() => gradePhases(r, { trajectory: 'T9' }));
});

test('B and E are separate series: writing a plan raises E, not B', () => {
  const steps = [['Bash', 'cat bin/price', CAT_PRICE], ['Bash', FIX, ''], ['Bash', 'bash tests/price_test.sh', 'rc=0']];
  const silent = gradePhases(rec(steps, { files: REPO }), { trajectory: 'T1' });
  const planned = gradePhases(rec([steps[0], ['say', 'Plan: I will change bin/price to round down (T1).'], ...steps.slice(1)], { files: REPO }), { trajectory: 'T1' });
  assert.deepEqual(planned.B, silent.B);
  assert.ok(planned.E.satisfied > silent.E.satisfied);
});

test('stale base: checking the base and bringing main in, before the first edit', () => {
  const both = rec([['Bash', 'git fetch; git log --oneline HEAD..main', 'abc1234 y'], ['Bash', 'git rebase main', 'ok'], ['Bash', 'cat bin/price', CAT_PRICE], ['Bash', FIX, '']], { files: REPO });
  const checkOnly = rec([['Bash', 'git merge-base --is-ancestor main HEAD; echo $?', '1'], ['Bash', 'cat bin/price', CAT_PRICE], ['Bash', FIX, '']], { files: REPO });
  const neither = rec([['Bash', 'cat bin/price', CAT_PRICE], ['Bash', FIX, ''], ['Bash', 'git rebase main', 'ok']], { files: REPO });
  assert.equal(check(both, 'research.base-brought', { base: 'stale' }), true);
  assert.equal(check(checkOnly, 'research.base-checked', { base: 'stale' }), true);
  assert.equal(check(checkOnly, 'research.base-brought', { base: 'stale' }), false);
  assert.equal(check(neither, 'research.base-checked', { base: 'stale' }), false);
  assert.equal(check(neither, 'research.base-brought', { base: 'stale' }), false, 'rebasing after the edit is too late');
});

test('notes and tests are not the implementation; a listed file is (README typo cell)', () => {
  const r = rec([['Bash', "echo 'plan' > notes/x.md; sed -i 's/teh/the/' README.md", '']], { files: REPO });
  assert.equal(phaseFacts(r, {}).firstImpl, null);
  assert.notEqual(phaseFacts(r, { implFiles: ['README.md'] }).firstImpl, null);
});

test('content types are classified both ways', () => {
  assert.equal(contentTypes('Plan: I will edit bin/price.').plan, true);
  assert.equal(contentTypes('bin/price prints 900.').plan, false);
  assert.equal(contentTypes('原因の仮説: 切り上げの式').hypothesis, true);
  assert.equal(contentTypes('Fixed it.').hypothesis, false);
  assert.equal(contentTypes('- test: 999 -> 899\n- test: 1000 -> 900').testList, true);
  assert.equal(contentTypes('- changed bin/price\n- changed bin/quote').testList, false);
  assert.equal(contentTypes('Option A: patch in place. Rejected option B because it adds a dependency.').alternatives, true);
  assert.equal(contentTypes('I changed the formula.').alternatives, false);
  assert.equal(contentTypes('軌道: T1').trajectory, true);
  assert.equal(contentTypes('Took 10 steps.').trajectory, false);
});
