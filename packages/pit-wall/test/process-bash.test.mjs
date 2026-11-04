import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCommand, findHeredocs } from '../src/graders/process/bash.mjs';
import { normPath, expand } from '../src/graders/process/paths.mjs';

const known = new Set(['bin/price', 'bin/quote', 'lib/invoice.sh', 'tests/price_test.sh', 'scripts/verify.sh', 'README.md']);
const acts = (cmd, cwd = '') => analyzeCommand(cmd, { cwd, known }).actions;
const of = (list, type) => list.filter((a) => a.type === type);

test('cat with a glob reads every matching file in full; a variable path reads nothing', () => {
  const a = acts('cat bin/* tests/price_test.sh; for f in lib/*; do cat "$f"; done');
  assert.deepEqual(of(a, 'read').map((x) => x.path), ['bin/price', 'bin/quote', 'tests/price_test.sh']);
  assert.ok(of(a, 'read').every((x) => x.range.kind === 'full'));
});

test('a heredoc body is data: paths and commands inside it are not read or run', () => {
  const a = acts("cat > notes/plan.md <<'EOF'\ncat bin/price\nbash tests/price_test.sh\nEOF\nls");
  assert.equal(of(a, 'read').length, 0);
  assert.equal(of(a, 'run').length, 0);
  const w = of(a, 'write');
  assert.equal(w.length, 1);
  assert.equal(w[0].path, 'notes/plan.md');
  assert.equal(w[0].text, 'cat bin/price\nbash tests/price_test.sh');
  assert.equal(w[0].authored, true);
});

test('sed -i with ; and | inside the quoted script is one in-place edit per file (EXP-21 form)', () => {
  const a = acts("sed -i 's|^total() .*|total() { echo $(( $1 * 110 / 100 )); }|' lib/invoice.sh");
  const w = of(a, 'write');
  assert.deepEqual(w.map((x) => [x.path, x.how]), [['lib/invoice.sh', 'sed-i']]);
  assert.equal(of(a, 'run').length, 0);
});

test('read ranges: sed -n, head, Read-like partial views and pipes into filters', () => {
  const a = acts("sed -n '10,20p' bin/price; head -5 README.md; cat tests/price_test.sh | grep fail; tail -n 3 bin/quote");
  const r = of(a, 'read');
  assert.deepEqual(r.map((x) => [x.path, x.range.kind]), [['bin/price', 'lines'], ['README.md', 'lines'], ['tests/price_test.sh', 'filtered'], ['bin/quote', 'tail']]);
  assert.deepEqual([r[0].range.from, r[0].range.to], [10, 20]);
  assert.deepEqual([r[1].range.from, r[1].range.to], [1, 5]);
});

test('grep: hits vs names-only (-l) vs a filter on piped input', () => {
  assert.equal(of(acts('grep -rn "90 + 99" bin lib'), 'search')[0].mode, 'hits');
  assert.deepEqual(of(acts('grep -rn "90 + 99" bin lib'), 'search')[0].paths, ['bin/price', 'bin/quote', 'lib/invoice.sh']);
  assert.equal(of(acts('grep -rl price .'), 'search')[0].mode, 'names');
  assert.equal(of(acts('git log --oneline | grep price'), 'search').length, 0);
});

test('redirections: 2>&1 and 2>/dev/null are not writes; > and >> are, with authored text only for echo/printf/heredoc', () => {
  assert.equal(of(acts('cat bin/price 2>&1; ls notes 2>/dev/null'), 'write').length, 0);
  const w = of(acts("printf 'a\\nb\\n' > notes/x.md; bash bin/price 999 > /tmp/out.txt"), 'write');
  assert.deepEqual(w.map((x) => [x.path, x.authored, x.text]), [['notes/x.md', true, 'a\nb\n'], ['/tmp/out.txt', false, null]]);
});

test('runs: test scripts, the program itself, inline scripts and bash -c', () => {
  const r = of(acts('bash tests/price_test.sh; bin/price 999; ./scripts/verify.sh; python3 - <<EOF\nprint(1)\nEOF\nbash -c "bash bin/quote 999"; npm test'), 'run');
  assert.deepEqual(r.map((x) => [x.target, x.isTest]), [['tests/price_test.sh', true], ['bin/price', false], ['scripts/verify.sh', true], [null, false], ['bin/quote', false], [null, true]]);
  // command substitution inside a test expression still runs the program
  assert.equal(of(acts('[ "$(bash bin/price 999)" = 899 ] || echo bad'), 'run')[0].target, 'bin/price');
});

test('commit messages and PR bodies, including heredocs inside $(...)', () => {
  const a = acts('git commit -q -am "PRC-1: fix\n\nbody" && gh pr create --title T --body "$(cat <<\'EOF\'\nSee bin/price:3\nEOF\n)"');
  assert.equal(of(a, 'commit')[0].message, 'PRC-1: fix\n\nbody');
  assert.deepEqual([of(a, 'post')[0].title, of(a, 'post')[0].body], ['T', 'See bin/price:3']);
  assert.equal(of(a, 'read').length, 0, 'the heredoc body of the PR is not a read');
});

test('git show rev:path is a full read of that version; git show <sha> is history; gh issue view N', () => {
  const a = acts('git show HEAD~1:bin/price; git show abc1234; gh issue view 71 -R x/y');
  assert.deepEqual(of(a, 'read').map((x) => [x.path, x.version]), [['bin/price', 'HEAD~1']]);
  assert.equal(of(a, 'history')[0].patch, true);
  assert.equal(of(a, 'gh')[0].number, 71);
});

test('cd is carried to later commands and calls', () => {
  const ctx = { cwd: '', known };
  analyzeCommand('cd /app/bin', ctx);
  assert.equal(ctx.cwd, 'bin');
  assert.equal(of(analyzeCommand('cat price', ctx).actions, 'read')[0].path, 'bin/price');
});

test('heredoc finder handles two heredocs on one line and <<- with tabs', () => {
  const d = findHeredocs('cat <<A >x; cat <<B >y\none\nA\ntwo\nB\ncat <<-C\n\tthree\n\tC\n');
  assert.deepEqual(d.map((x) => x.body), ['one', 'two', '\tthree']);
});

test('path normalisation: container prefix, Windows and Git-Bash forms, ./ and ..', () => {
  assert.equal(normPath('/app/bin/price'), 'bin/price');
  assert.equal(normPath('./bin/../bin/price'), 'bin/price');
  assert.equal(normPath('bin\\price'), 'bin/price');
  assert.equal(normPath('/c/work/repo/bin/price'), 'C:/work/repo/bin/price');
  assert.equal(normPath('C:\\work\\repo\\bin\\price'), 'C:/work/repo/bin/price');
  assert.deepEqual(expand('C:/work/repo/bin/price', '', known), ['bin/price']);
  assert.equal(normPath('"$f"'), null);
});
