// Q2 citation grounding, checked both ways on scripted trajectories: a citation of something
// visible before it was written is O / P / M; one of something never shown, shown only later,
// or absent from the record is N / X; what cannot be decided is U.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gradeGrounding, extractCitations, normUrl } from '../src/graders/process/grounding.mjs';
import { authoredTexts } from '../src/graders/process/authored.mjs';
import { eventTable } from '../src/graders/process/events.mjs';
import { rec, REPO, CAT_PRICE } from './process-helpers.mjs';

// Class of the first citation whose value matches.
const cls = (r, value) => {
  const c = gradeGrounding(r).citations.find((x) => String(x.value) === String(value));
  assert.ok(c, `no citation ${value}`);
  return c;
};

test('cited file opened before the claim -> O; never opened -> N', () => {
  const opened = rec([['Bash', 'cat bin/price', CAT_PRICE]], { files: REPO, final: 'The bug is in `bin/price`.' });
  const never = rec([['Bash', 'ls', 'README.md']], { files: REPO, final: 'The bug is in `bin/price`.' });
  assert.equal(cls(opened, 'bin/price').cls, 'O');
  assert.equal(cls(never, 'bin/price').cls, 'N');
});

test('cited file opened only after the claim -> N (the claim was written blind)', () => {
  const r = rec([['say', 'The rounding is wrong in bin/quote.'], ['Bash', 'cat bin/quote', REPO['bin/quote']]], { files: REPO });
  assert.equal(cls(r, 'bin/quote').cls, 'N');
});

test('non-existent path -> X; the same path in a negated sentence -> U', () => {
  const x = rec([['Bash', 'cat bin/price', CAT_PRICE]], { files: REPO, final: 'I also updated lib/money/round.sh.' });
  const neg = rec([['Bash', 'cat bin/price', CAT_PRICE]], { files: REPO, final: 'There is no lib/money/round.sh in this repo.' });
  assert.equal(cls(x, 'lib/money/round.sh').cls, 'X');
  assert.equal(cls(neg, 'lib/money/round.sh').cls, 'U');
  // without an end state, existence cannot be decided
  const noState = rec([['Bash', 'cat bin/price', CAT_PRICE]], { final: 'I also updated lib/money/round.sh.' });
  noState.state = null;
  assert.equal(cls(noState, 'lib/money/round.sh').cls, 'U');
});

test('an error result is not an opening: "File does not exist" then cite -> N', () => {
  const r = rec([['Read', { file_path: '/app/bin/price' }, 'File does not exist.', true]], { files: REPO, final: 'See `bin/price`.' });
  assert.equal(cls(r, 'bin/price').cls, 'N');
});

test('grep hit lines only -> P; a whole-file read -> O', () => {
  const hits = rec([['Bash', 'grep -rn "90 + 99" bin', 'bin/price:3:echo $(( ($1 * 90 + 99) / 100 ))']], { files: REPO, final: 'The formula in bin/price rounds up.' });
  assert.equal(cls(hits, 'bin/price').cls, 'P');
  const grepTool = rec([['Grep', { pattern: '90 \\+ 99', path: 'bin', output_mode: 'content' }, 'bin/price:3:echo $(( ($1 * 90 + 99) / 100 ))']], { files: REPO, final: 'The formula in bin/price rounds up.' });
  assert.equal(cls(grepTool, 'bin/price').cls, 'P');
  const names = rec([['Grep', { pattern: '90', path: 'bin' }, 'bin/price']], { files: REPO, final: 'The formula in bin/price rounds up.' });
  assert.equal(cls(names, 'bin/price').cls, 'M');
});

test('line references: inside the Read range -> O, outside -> P', () => {
  const files = { ...REPO, 'lib/big.sh': Array.from({ length: 50 }, (_, k) => `line_${k + 1}=value_${k + 1}`).join('\n') };
  const shown = Array.from({ length: 10 }, (_, k) => `${String(k + 1).padStart(6)}\tline_${k + 1}=value_${k + 1}`).join('\n');
  const r = rec([['Read', { file_path: '/app/lib/big.sh', offset: 1, limit: 10 }, shown]], { files, final: 'See lib/big.sh:5 and lib/big.sh:40.' });
  const cs = gradeGrounding(r).citations.filter((c) => c.type === 'path');
  assert.deepEqual(cs.map((c) => [c.line, c.cls]), [[5, 'O'], [40, 'P']]);
});

test('WebSearch snippet -> P; WebFetch summary -> P; a URL never fetched -> N', () => {
  const u = 'https://example.org/rounding-guide';
  const search = rec([['WebSearch', { query: 'rounding' }, `Rounding guide\n${u}\nRound down member prices...`]], { files: REPO, final: `Per ${u}, round down.` });
  const fetch = rec([['WebFetch', { url: u, prompt: 'summarise' }, 'The page says to round down.']], { files: REPO, final: `Per ${u}, round down.` });
  const never = rec([['Bash', 'ls', 'x']], { files: REPO, final: `Per ${u}, round down.` });
  assert.equal(cls(search, u).cls, 'P');
  assert.equal(cls(fetch, u).cls, 'P');
  assert.equal(cls(never, u).cls, 'N');
  assert.equal(normUrl('http://arxiv.org/pdf/2506.18824v2'), normUrl('https://arxiv.org/abs/2506.18824'));
});

test('a subagent relay is partial: the parent saw only the reply', () => {
  const r = rec([['Agent', { prompt: 'find the rounding helper' }, 'The helper is round_down_cents in lib/x.sh.']], { files: REPO, final: 'The helper is `round_down_cents`.' });
  assert.equal(cls(r, 'round_down_cents').cls, 'P');
});

test('symbols: seen in a file read -> O with S1; nowhere in the record -> X', () => {
  const files = { ...REPO, 'lib/util.sh': 'round_tenth() { echo $(( ($1 + 5) / 10 )); }\n' };
  const seen = rec([['Bash', 'cat lib/util.sh', files['lib/util.sh']]], { files, final: 'Reuse `round_tenth()` from the helper.' });
  const fake = rec([['Bash', 'cat lib/util.sh', files['lib/util.sh']]], { files, final: 'Reuse `round_half_even()` from the helper.' });
  assert.deepEqual([cls(seen, 'round_tenth').cls, cls(seen, 'round_tenth').support], ['O', 'S1']);
  assert.equal(cls(fake, 'round_half_even').cls, 'X');
  // exists in the repo but never shown -> N
  const unseen = rec([['Bash', 'ls lib', 'util.sh']], { files, final: 'Reuse `round_tenth()` from the helper.' });
  assert.equal(cls(unseen, 'round_tenth').cls, 'N');
});

test('issues: viewed -> O; only in the instruction -> M; never shown -> N', () => {
  const viewed = rec([['Bash', 'gh issue view 71', 'PRC-501: bin/price 999 prints 900']], { files: REPO, final: 'Fixes #71.' });
  const fromTask = rec([['Bash', 'ls', 'x']], { files: REPO, final: 'Fixes #71.', instruction: 'Work on issue #71.' });
  const never = rec([['Bash', 'ls', 'x']], { files: REPO, final: 'Fixes #72.' });
  assert.equal(cls(viewed, 71).cls, 'O');
  assert.equal(cls(fromTask, 71).cls, 'M');
  assert.equal(cls(never, 72).cls, 'N');
});

test('commands: ran before the claim -> O; a shortened form still matches; never ran -> N', () => {
  const ran = rec([['Bash', 'bash scripts/verify.sh; echo rc=$?', 'rc=0']], { files: REPO, final: '`bash scripts/verify.sh` exits 0.' });
  const short = rec([['Bash', "sed -i '$d' tests/price_test.sh", '']], { files: REPO, final: "I removed the last line with `sed '$d'`." });
  const never = rec([['Bash', 'ls', 'x']], { files: REPO, final: '`bash scripts/verify.sh` exits 0.' });
  assert.equal(cls(ran, 'bash scripts/verify.sh').cls, 'O');
  assert.equal(cls(short, "sed '$d'").cls, 'O');
  assert.equal(cls(never, 'bash scripts/verify.sh').cls, 'N');
});

test('a file the agent creates later is U (a plan), a file it wrote itself is O', () => {
  const plan = rec([['say', 'I will record the cause in notes/PRC-1.md.'], ['Bash', "cat > notes/PRC-1.md <<'E'\ncause\nE", '']], { files: { ...REPO, 'notes/PRC-1.md': 'cause\n' }, final: 'The cause is in notes/PRC-1.md.' });
  const cs = gradeGrounding(plan).citations.filter((c) => c.value === 'notes/PRC-1.md');
  assert.deepEqual(cs.map((c) => [c.where, c.cls]), [['message', 'U'], ['final', 'O']]);
});

test('numbers: seen in an output -> O with S1; computed by the agent -> U, never N', () => {
  const r = rec([['Bash', 'bin/price 999', '900']], { files: REPO, final: 'It printed 900; the right value is 899.' });
  assert.deepEqual([cls(r, '900').cls, cls(r, '900').support], ['O', 'S1']);
  assert.equal(cls(r, '899').cls, 'U');
});

test('path forms are normalised before matching (container prefix, ./)', () => {
  const r = rec([['Bash', 'cat /app/bin/price', CAT_PRICE]], { files: REPO, final: 'See ./bin/price and /app/bin/price.' });
  const cs = gradeGrounding(r).citations.filter((c) => c.type === 'path');
  assert.ok(cs.length >= 2 && cs.every((c) => c.cls === 'O'), JSON.stringify(cs));
});

test('the N + X rate counts locators only; slash commands and divisions are not paths', () => {
  const r = rec([['Bash', 'cat bin/price', CAT_PRICE]], { files: REPO, final: 'See `bin/price` and lib/nope/x.sh. Use /dev. The formula is (x*90)/100. It was 1234.' });
  const g = gradeGrounding(r);
  assert.equal(g.citations.some((c) => c.value === '/dev' || c.value === '/100'), false);
  assert.equal(g.locators, 2);
  assert.equal(g.nxRate, 0.5);
});

test('extraction: code spans, paths with lines, issue and PR refs, SHAs; templates are skipped', () => {
  const c = extractCitations('See `lib/x.sh:10-20`, src/a.ts#L5, PR #12 and issue 7, commit 3af6c2e. Write `notes/<id>.md`.', { topDirs: new Set(['src', 'lib']) });
  assert.deepEqual(c.map((x) => [x.type, x.value, x.line ?? null]), [
    ['path', 'lib/x.sh', 10], ['path', 'src/a.ts', 5], ['issue', 12, null], ['issue', 7, null], ['commit', '3af6c2e', null],
  ]);
});

test('authored text is collected from every place, with its position (Q4)', () => {
  const r = rec([
    ['TodoWrite', { todos: [{ content: 'read bin/price' }] }, 'ok'],
    ['Bash', "cat > notes/plan.md <<'E'\nchange bin/price\nE", ''],
    ['Bash', 'git commit -m "fix bin/price" && gh pr create --title "Fix" --body "Changes bin/price"', ''],
    ['Agent', { prompt: 'look at bin/quote' }, 'done'],
  ], { files: REPO, final: 'Done.' });
  const a = authoredTexts(r, eventTable(r));
  assert.deepEqual(a.map((x) => x.where), ['todo', 'file', 'commit', 'pr', 'agent-prompt', 'final']);
  assert.ok(a.every((x, k) => k === 0 || x.pos >= a[k - 1].pos));
  // code written to a source file is authored, but is not prose to search for citations
  const code = rec([['Write', { file_path: '/app/bin/price', content: 'echo see lib/none.sh' }, 'ok']], { files: REPO });
  assert.deepEqual(authoredTexts(code, eventTable(code)).map((x) => [x.where, x.prose]), [['file', false]]);
});
