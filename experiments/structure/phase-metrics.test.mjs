// Command shapes the transcript parser missed or mis-ordered in real runs (EXP-19..21).
// Each case is copied (shortened) from a trial; the run and trial id is in the test name.
// Run: node --test experiments/structure/phase-metrics.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { audit, metrics } from './phase-metrics.mjs';

const line = (name, input) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } });
const bash = (...cmds) => metrics(cmds.map((command) => line('Bash', { command })));
const ord = (m) => ({ memo: m.order.memo !== null, test: m.order.test !== null, impl: m.order.impl !== null });

test('EXP-19: memo written by a heredoc inside the same Bash call as the fix, after it', () => {
  const m = bash("sed -i 's/(\\$1 \\* 90 + 99) \\/ 100/$1 * 90 \\/ 100/' bin/price bin/quote lib/invoice.sh\nmkdir -p notes && cat > notes/PRC-201.md <<'EOF'\n# PRC-201\nEOF");
  assert.deepEqual(ord(m), { memo: true, test: false, impl: true });
  assert.equal(m.skippedMemo, true);
});

test('EXP-21 FMvrxwf: sed -i whose expression contains `;` is an implementation edit', () => {
  const m = bash("sed -i 's|^total() .*|total() { echo $(( $1 * 110 / 100 )); }|' lib/sum_total.sh\nmkdir -p notes\ncat > notes/CHK-310.md <<'EOF'\n# memo\nEOF");
  assert.equal(m.order.impl !== null, true);
  assert.equal(m.skippedMemo, true);
});

test('EXP-21 8WWDusA: line-addressed sed -i with an escaped slash', () => {
  assert.equal(bash("sed -i '3s/.*/total() { echo $(( $1 * 110 \\/ 100 )); }/' lib/sum_total.sh").order.impl !== null, true);
});

test('EXP-21 CB9mee9: a test appended with sed -i is a test write, not a skip', () => {
  const m = bash("mkdir -p notes\ncat > notes/PRC-201.md <<'EOF'\n- fix with sed -i 's/a/b/' bin/price\nEOF\necho '[ x ]' > /tmp/l\nsed -i '/^exit/e cat /tmp/l' tests/price_test.sh\nsed -i 's/(\\(\\$1 \\* 90\\) + 99) \\/ 100/\\1 \\/ 100/' bin/price bin/quote lib/invoice.sh");
  assert.deepEqual(ord(m), { memo: true, test: true, impl: true });
  assert.equal(m.skippedMemo || m.skippedTest, false);
});

test('a command quoted inside a memo heredoc is data, not an edit', () => {
  const m = bash("cat > notes/A.md <<'EOF'\nfix: sed -i 's/a/b/' bin/price\nEOF");
  assert.deepEqual(ord(m), { memo: true, test: false, impl: false });
});

test('a quoted path after sed -i -e is kept', () => {
  assert.equal(bash('sed -i -e "s/a/b/" "lib/x.sh"').order.impl !== null, true);
});

test('EXP-21 LJU3rzX: absolute /app/ paths in redirections and in-place edits', () => {
  const m = bash("mkdir -p /app/notes && cat > /app/notes/CHK-310.md <<'EOF'\n# memo\nEOF\nsed -i 's/x/y/' /app/lib/sum_total.sh\ncat >> ./tests/checkout_test.sh <<'EOF'\n[ x ]\nEOF");
  assert.deepEqual(ord(m), { memo: true, test: true, impl: true });
});

test('a here-string is not a heredoc', () => {
  const m = bash('grep x <<<"$v"\ncat > notes/A.md <<EOF\nhi\nEOF');
  assert.equal(m.order.memo !== null, true);
});

test('reading and running files is not writing them', () => {
  assert.deepEqual(ord(bash('cat lib/x.sh bin/price; bash bin/price 999; bash tests/price_test.sh')), { memo: false, test: false, impl: false });
});

test('Write and Edit tools count by path', () => {
  const m = metrics([line('Write', { file_path: '/app/notes/X.md' }), line('Edit', { file_path: '/app/tests/t_test.sh' }), line('Edit', { file_path: '/app/lib/x.sh' })]);
  assert.deepEqual(ord(m), { memo: true, test: true, impl: true });
  assert.equal(m.skippedMemo || m.skippedTest, false);
});

test('EXP-23 t4: checking out the base to see the test fail first is not an implementation edit', () => {
  const co = ['git', 'checkout', '-q'].join(' ');
  const m = bash(`${co} f02b252 -- bin lib; bash scripts/verify.sh; echo before-fix rc=$?; ${co} HEAD -- bin lib; bash scripts/verify.sh`);
  assert.deepEqual(ord(m), { memo: false, test: false, impl: false });
  assert.equal(m.order.verify !== null, true);
});

test('EXP-24 t5: rebasing onto main and merging into main carry edits, they are not edits', () => {
  const m = bash("git diff main --stat; git rebase -q main", "sed -i 's/(\\$1 \\* 90 + 99) \\/ 100/$1 * 90 \\/ 100/' bin/price lib/statement.sh", "git add -A; git commit -qm 'PRC-501 fix'; git checkout -q main && git merge -q --ff-only fix/PRC-501");
  assert.deepEqual(ord(m), { memo: false, test: false, impl: true });
  assert.equal(Math.floor(m.order.impl), 1);
  assert.equal(m.order.commit !== null, true);
});

test('EXP-27 s1: a README fix is the implementation only where the cell says so', () => {
  const cmds = ["sed -i 's/Member prise/Member price/' README.md", 'cat README.md'];
  assert.equal(metrics(cmds.map((command) => line('Bash', { command })), { implFiles: ['README.md'] }).order.impl !== null, true);
  assert.equal(metrics(cmds.map((command) => line('Bash', { command }))).order.impl, null);          // other cells: README is not an implementation
  assert.equal(metrics([line('Edit', { file_path: '/app/README.md' })], { implFiles: ['README.md'] }).order.impl !== null, true);
  assert.equal(metrics([line('Bash', { command: 'cat README.md; grep -n prise README.md' })], { implFiles: ['README.md'] }).order.impl, null); // reading is not editing
  assert.equal(metrics([line('Bash', { command: "sed -i 's/a/b/' README.md.bak" })], { implFiles: ['README.md'] }).order.impl, null);  // another file
});

test('EXP-28 t7: a solved task with no code edit is not a miss there, and still is elsewhere', () => {
  const m = bash('gh pr checks 12; gh pr comment 12 --body x');
  const res = [{ name: 'task-done', passed: true }];
  assert.deepEqual(audit(m, res, 't7-unrun-checks-start'), []);
  assert.deepEqual(audit(m, res, 't8-unmet-ac-start'), ['impl']);
});

test('audit flags a final-state event the parse missed, and only that', () => {
  const m = bash('true');
  const res = [{ name: 'memo', passed: true }, { name: 'failing-first', passed: true }, { name: 'task-done', passed: true }];
  assert.deepEqual(audit(m, res, 't1-parallel-start'), ['impl', 'memo', 'test']);
  assert.deepEqual(audit(m, res, 't1-parallel-midway'), ['impl']);
  assert.deepEqual(audit(m, res.map((r) => ({ ...r, passed: false })), 't1-parallel-start'), []);
});
