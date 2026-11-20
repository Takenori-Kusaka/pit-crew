// `gh pr view` after this session merged or closed the PR (shims/gh, "pr view" without a seeded snapshot).
// The stand-in answered `gh pr merge` with "✓ Merged pull request" and the next `gh pr view` with state OPEN
// (gate run 3, 2026-11-18, kit/results/dev/verify-gate3.md 7.5 defect 7: an agent reported that it could not
// confirm its own merge). The answer of a view now carries what the session did. The fix is in the stand-in,
// not in a fixture, so every role's scenes get it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRELUDE, shell } from './shell-helpers.mjs';

function run(scenarios) {
  const parts = [PRELUDE];
  for (const [name, script] of Object.entries(scenarios)) parts.push(`(
d=$(mktemp -d); cd "$d"; mkdir -p .st; export PITWALL_GH_STATE="$d/.st/s.json"
{ ${script.trim()}
} 2>&1 | sed 's/^/OUT\t${name}\t/'
)`);
  const { stdout } = shell(parts.join('\n'));
  const out = {};
  for (const l of stdout.split('\n')) {
    const [tag, name, ...rest] = l.split('\t');
    if (tag === 'OUT') (out[name] ??= []).push(rest.join('\t'));
  }
  return out;
}

const out = run({
  'open': `gh pr create --title t --body b >/dev/null
gh pr view 1
gh pr view 1 --json state,isDraft`,
  'merged': `gh pr create --title t --body b >/dev/null
gh pr merge 1 --squash
gh pr view 1
gh pr view 1 --json state,mergeable`,
  'merged-no-number': `gh pr create --title t --body b >/dev/null
gh pr merge --squash >/dev/null
gh pr view`,
  'closed-then-reopened': `gh pr create --title t --body b >/dev/null
gh pr close 1 >/dev/null
gh pr view 1
gh pr reopen 1 >/dev/null
gh pr view 1`,
  'draft-then-ready': `gh pr create --title t --body b --draft >/dev/null
gh pr view 1 --json isDraft
gh pr ready 1 >/dev/null
gh pr view 1 --json isDraft`,
  'fixture-text': `mkdir -p .github-cache; printf '#7 opened by sam\nstate: OPEN\n' > .github-cache/pr-7.md
gh pr view 7
gh pr merge 7 >/dev/null
gh pr view 7`,
  'fixture-json': `mkdir -p .github-cache; echo '{"number":7,"state":"OPEN","isDraft":false,"title":"x"}' > .github-cache/pr-7.json
gh pr view 7 --json state,title
gh pr merge 7 >/dev/null
gh pr view 7 --json state,title`,
  'api-merge': `gh pr create --title t --body b >/dev/null
gh api -X PUT repos/acme/shop/pulls/1/merge >/dev/null
gh pr view 1 --json state`,
});

test('an open PR is answered as before', () => {
  assert.equal(out.open[0], '#1 opened by you · CI passing · review required');
  assert.equal(JSON.parse(out.open[1]).state, 'OPEN');
  assert.equal(JSON.parse(out.open[1]).isDraft, false);
});

test('after gh pr merge, the view says MERGED (text and --json)', () => {
  assert.equal(out.merged[0], '✓ Merged pull request #1');
  assert.equal(out.merged[1], '#1 opened by you · merged');
  const j = JSON.parse(out.merged[2]);
  assert.equal(j.state, 'MERGED');
  assert.notEqual(j.mergeable, 'MERGEABLE');
});

test('the PR of the branch (no number) is answered the same way', () => {
  assert.equal(out['merged-no-number'][0], '#1 opened by you · merged');
});

test('close and reopen are followed', () => {
  assert.equal(out['closed-then-reopened'][0], '#1 opened by you · closed');
  assert.equal(out['closed-then-reopened'][1], '#1 opened by you · CI passing · review required');
});

test('a draft made ready is no longer a draft', () => {
  assert.equal(JSON.parse(out['draft-then-ready'][0]).isDraft, true);
  assert.equal(JSON.parse(out['draft-then-ready'][1]).isDraft, false);
});

test('a fixture text is kept, with the changed state said first', () => {
  assert.deepEqual(out['fixture-text'].slice(0, 2), ['#7 opened by sam', 'state: OPEN']);
  assert.deepEqual(out['fixture-text'].slice(2), ['state:\tMERGED', '#7 opened by sam', 'state: OPEN']);
});

test('a fixture JSON gets the changed state', () => {
  assert.deepEqual(JSON.parse(out['fixture-json'][0]), { state: 'OPEN', title: 'x' });
  assert.deepEqual(JSON.parse(out['fixture-json'][1]), { state: 'MERGED', title: 'x' });
});

test('a merge through gh api is followed too', () => {
  assert.equal(JSON.parse(out['api-merge'][0]).state, 'MERGED');
});
