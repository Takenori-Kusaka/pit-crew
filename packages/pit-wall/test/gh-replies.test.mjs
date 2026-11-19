// What the gh stand-in PRINTS for a write (shims/gh, "Replies"): gh answers a creation or a comment with one
// line, the URL of the thing written. The stand-in used to answer `gh pr create` with a bare "ok" and to build a
// comment's URL from the third word of the call, so an agent could not check its own call (2026-11-16 screening,
// kit/results/dev/verify-screen1.md, 9). The state the graders read (json / tsv / unparsed) is not changed by a reply.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRELUDE, shell } from './shell-helpers.mjs';

// each scenario in its own directory and state; prints "<name>\t<line>" per output line, then the state files
function run(scenarios) {
  const parts = [PRELUDE];
  for (const [name, script] of Object.entries(scenarios)) parts.push(`(
d=$(mktemp -d); cd "$d"; mkdir -p .st; export PITWALL_GH_STATE="$d/.st/s.json"
{ ${script.trim().split('\n').join('\n')}
} 2>&1 | sed 's/^/OUT\\t${name}\\t/'
printf 'JSON\\t%s\\t%s\\n' '${name}' "$(base64 -w0 < .st/s.json 2>/dev/null)"
printf 'FILES\\t%s\\t%s\\n' '${name}' "$(ls .st | tr '\\n' ' ')"
printf 'UNPARSED\\t%s\\t%s\\n' '${name}' "$(base64 -w0 < .st/s.unparsed 2>/dev/null)"
)`);
  const { stdout } = shell(parts.join('\n'));
  const out = {};
  for (const l of stdout.split('\n')) {
    const [tag, name, ...rest] = l.split('\t');
    if (!['OUT', 'JSON', 'FILES', 'UNPARSED'].includes(tag)) continue;
    const o = (out[name] ??= { lines: [], state: null, files: [], unparsed: '' });
    if (tag === 'OUT') o.lines.push(rest.join('\t'));
    if (tag === 'JSON') o.state = rest[0] ? JSON.parse(Buffer.from(rest[0], 'base64').toString('utf8')) : null;
    if (tag === 'FILES') o.files = rest[0].trim().split(' ').filter(Boolean).sort();
    if (tag === 'UNPARSED') o.unparsed = rest[0] ? Buffer.from(rest[0], 'base64').toString('utf8') : '';
  }
  return out;
}

const out = run({
  'pr-create': `gh pr create --title "fix: discount" --body "Fixes the double discount"`,
  'pr-create-fixture-issue': `mkdir -p .github-cache; echo "# an issue" > .github-cache/issue-12.md
gh pr create --title t --body b
gh pr create -t t2 -b b2 --draft
gh issue create --title "follow-up" --body "x"`,
  'pr-create-repo': `gh pr create -R acme/shop --title t --body b`,
  'pr-create-fill': `gh pr create --fill`,
  'issue-comment-forms': `gh issue comment 12 --body "first"
gh issue comment --body "second" 12
gh issue comment -b "third" '#12'
gh issue comment https://github.com/acme/shop/issues/12 -b "fourth"
echo fifth | gh issue comment 12 -F -
gh issue comment -R acme/shop 7 -b "sixth"`,
  'pr-comment': `gh pr comment 34 --body "note"
gh pr comment --body "again" 34`,
  'comment-on-created-pr': `mkdir -p .github-cache; echo "# an issue" > .github-cache/issue-12.md
gh pr create --title t --body b
gh pr comment 13 --body "ready for review"
gh pr comment --body "no number: the PR of this branch"
gh pr view 13`,
  'comment-then-create': `gh issue comment 12 --body "a question"
gh pr create --title t --body b`,
  'pr-comment-no-number-no-pr': `gh pr comment --body "x"`,
  'edit-forms': `gh issue edit --add-label needs-po 12
gh pr edit 34 --title "new"`,
  'others': `gh repo clone example/repo
gh pr ready 34
gh pr merge 34`,
});

test('gh pr create / gh issue create answer with the URL of the new item, not "ok"', () => {
  assert.deepEqual(out['pr-create'].lines, ['https://github.com/example/repo/pull/1']);
  // numbers follow the fixture's issue; issues and PRs share one number space; every creation gets its own
  assert.deepEqual(out['pr-create-fixture-issue'].lines, ['https://github.com/example/repo/pull/13', 'https://github.com/example/repo/pull/14', 'https://github.com/example/repo/issues/15']);
  // the repository the caller named is echoed back
  assert.deepEqual(out['pr-create-repo'].lines, ['https://github.com/acme/shop/pull/1']);
  assert.deepEqual(out['pr-create-fill'].lines, ['https://github.com/example/repo/pull/1']);
  // a number someone already used in a call is not given to a new item
  assert.deepEqual(out['comment-then-create'].lines, ['https://github.com/example/repo/issues/12#issuecomment-1', 'https://github.com/example/repo/pull/13']);
});

test('a comment answers with the URL of the item it was made on, wherever the number is in the call; the id grows', () => {
  assert.deepEqual(out['issue-comment-forms'].lines, [
    'https://github.com/example/repo/issues/12#issuecomment-1',
    'https://github.com/example/repo/issues/12#issuecomment-2',
    'https://github.com/example/repo/issues/12#issuecomment-3',
    'https://github.com/example/repo/issues/12#issuecomment-4',
    'https://github.com/example/repo/issues/12#issuecomment-5',
    'https://github.com/acme/shop/issues/7#issuecomment-6']);
  assert.deepEqual(out['pr-comment'].lines, ['https://github.com/example/repo/pull/34#issuecomment-1', 'https://github.com/example/repo/pull/34#issuecomment-2']);
  // on a PR this session created, by number and (as gh does for the current branch) without one
  assert.deepEqual(out['comment-on-created-pr'].lines.slice(0, 3), ['https://github.com/example/repo/pull/13', 'https://github.com/example/repo/pull/13#issuecomment-1', 'https://github.com/example/repo/pull/13#issuecomment-2']);
  assert.match(out['comment-on-created-pr'].lines[3], /^#13 opened by you/);
  // no number and no PR of this session: gh fails (there is no PR for the branch)
  assert.match(out['pr-comment-no-number-no-pr'].lines[0], /^no pull requests found for branch "/);
  assert.deepEqual(out['edit-forms'].lines, ['https://github.com/example/repo/issues/12', 'https://github.com/example/repo/pull/34']);
});

test('the record the graders read is as before: the same state, and the only new file is the numbers beside it', () => {
  // created items: still without a number in the state (the shape kit/schema/trial-record.md describes)
  assert.deepEqual(out['pr-create'].state, { items: {}, created: { pullRequests: [{ title: 'fix: discount', body: 'Fixes the double discount', draft: false }], issues: [] } });
  assert.deepEqual(out['pr-create-fixture-issue'].state.created.pullRequests.map((p) => [p.title, p.draft]), [['t', false], ['t2', true]]);
  assert.deepEqual(out['pr-create-fixture-issue'].state.created.issues.map((p) => p.title), ['follow-up']);
  assert.deepEqual(out['pr-create-fixture-issue'].state.items, {});
  assert.deepEqual(out['issue-comment-forms'].state.items['12'].comments, ['first', 'second', 'third', 'fourth', 'fifth']);
  assert.deepEqual(out['issue-comment-forms'].state.items['7'].comments, ['sixth']);
  // a comment without a number goes to the PR of the branch (the one this session created), in the state too
  assert.deepEqual(out['comment-on-created-pr'].state.items['13'].comments, ['ready for review', 'no number: the PR of this branch']);
  assert.equal(out['comment-on-created-pr'].unparsed, '');
  assert.deepEqual(out['pr-create'].files, ['s.facts', 's.json', 's.numbers', 's.tsv']);
  assert.deepEqual(out['issue-comment-forms'].files, ['s.facts', 's.json', 's.tsv'], 'a comment writes no numbers file');
  // other answers are unchanged
  assert.deepEqual(out.others.lines, ['ok', '✓ Pull request #34 is marked as "ready for review"', '✓ Merged pull request #34']);
});
