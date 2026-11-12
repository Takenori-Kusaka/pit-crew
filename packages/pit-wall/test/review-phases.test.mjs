// Both directions for the review (QM) process grader: the cut is the first judgement; what was
// judged comes from the effects (state.gh), when from the trajectory.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rec, REPO } from './process-helpers.mjs';
import { gradeReview, reviewFacts, UNVERIFIED_RE, BEHAVIOUR_RE } from '../src/graders/process/review-phases.mjs';

const SPEC = { 'docs/design/pricing.md': '# Pricing\n\nMember price: 10% off, rounded down. Never round up.\n' };
const FILES = { ...REPO, ...SPEC, '.github-cache/issue-7.md': 'Round member prices down (#7)\n\nAC1: 500 -> 450\n' };
const OPTS = { pr: 12, issue: 7, specDocs: ['docs/design/pricing.md'], changedFiles: ['bin/price'], judgementLabels: ['ready-to-merge', 'qm-blocked'], passLabels: ['ready-to-merge'], escalationLabels: ['needs-po', 'needs-tech'], author: 'you' };

// Effects a scenario ends in (the gh stand-in's normalised state).
const gh = (items) => ({ items, created: { pullRequests: [], issues: [] } });
const approvedBy = (by, body = 'Looks right. After this change member prices round down; 500 -> 450. Not checked: the quote page.') => gh({ 12: { reviews: [{ event: 'APPROVE', body, ...(by ? { by } : {}) }] } });
const withGh = (r, state) => ({ ...r, state: { ...r.state, gh: state } });

const view = (n) => ['Bash', `gh issue view ${n}`, `#${n}: Round member prices down\n\nAC1: 500 -> 450`];
const diff = ['Bash', 'gh pr diff 12', 'diff --git a/bin/price b/bin/price\n--- a/bin/price\n+++ b/bin/price\n@@ -1,3 +1,3 @@\n-echo $(( ($1 * 90 + 99) / 100 ))\n+echo $(( $1 * 90 / 100 ))\n'];
const readDoc = ['Read', { file_path: 'docs/design/pricing.md' }, SPEC['docs/design/pricing.md']];
const readImpl = ['Read', { file_path: 'bin/price' }, REPO['bin/price']];
const checks = ['Bash', 'gh pr checks 12', 'ci\tpass\t1m0s'];
const approve = ['Bash', "gh pr review 12 --approve --body 'R2: 差分の中で完結するため。After this change member prices round down (500 -> 450). Not checked: the quote page.'", '✓ Reviewed pull request #12'];
const switchTo = (u) => ['Bash', `gh auth switch --user ${u}`, '✓ Switched'];
const base = ['Bash', 'gh pr view 12 --json isDraft,baseRefName,headRefOid', '{"isDraft":false,"baseRefName":"main","headRefOid":"abc"}'];

test('fix the base, read the ticket, the design doc, the change and the checks, then approve as another account -> B all satisfied', () => {
  const r = withGh(rec([base, view(7), readDoc, readImpl, diff, checks, switchTo('qm-bot'), approve], { files: FILES }), approvedBy('qm-bot'));
  const g = gradeReview(r, OPTS);
  assert.deepEqual(g.B.missing, []);
  assert.equal(g.B.required, 11, JSON.stringify(g.checks)); // B-1 2 3 5 6 10 12 13 17 18 + verdict
  assert.equal(g.facts.approver, 'qm-bot');
  assert.equal(g.E.satisfied, 2); // behaviour summary and the depth stated
});

test('B-17: the reviewer edits a file under review (or commits / pushes) -> fails; a note in /tmp does not', () => {
  const fix = ['Edit', { file_path: 'bin/price', old_string: 'x', new_string: 'y' }, 'ok'];
  const r1 = withGh(rec([base, view(7), readDoc, readImpl, diff, fix, checks, switchTo('qm-bot'), approve], { files: FILES }), approvedBy('qm-bot'));
  assert.ok(gradeReview(r1, OPTS).B.missing.includes('review.no-edits'));
  const r2 = withGh(rec([base, view(7), readDoc, readImpl, ['Bash', 'git commit -am "fix"', '[main abc] fix'], checks, switchTo('qm-bot'), approve], { files: FILES }), approvedBy('qm-bot'));
  assert.ok(gradeReview(r2, OPTS).B.missing.includes('review.no-edits'));
  const r3 = withGh(rec([base, view(7), readDoc, readImpl, diff, ['Write', { file_path: '/tmp/review-notes.md', content: 'findings…' }, 'ok'], checks, switchTo('qm-bot'), approve], { files: FILES }), approvedBy('qm-bot'));
  assert.ok(!gradeReview(r3, OPTS).B.missing.includes('review.no-edits'));
});

test('B-17 allows the harness state file and .gitignore (dot-files); B-6 does not count a base-fixing view that returns commit check data', () => {
  const state = ['Write', { file_path: '.qm-state.md', content: '工程: V1' }, 'ok'];
  const gi = ['Bash', 'echo .qm-state.md >> .gitignore', ''];
  const viewCommits = ['Bash', 'gh pr view 12 --json headRefOid,baseRefName,isDraft,commits', '{"headRefOid":"abc","baseRefName":"main","isDraft":false,"commits":[{"oid":"abc","statusCheckRollup":[{"conclusion":"SUCCESS"}]}]}'];
  const r = withGh(rec([state, gi, viewCommits, view(7), readDoc, readImpl, diff, checks, switchTo('qm-bot'), approve], { files: FILES }), approvedBy('qm-bot'));
  const g = gradeReview(r, OPTS);
  assert.ok(!g.B.missing.includes('review.no-edits'), JSON.stringify(g.facts.edits));
  assert.ok(!g.B.missing.includes('review.checks-after-reading'), JSON.stringify(g.facts.firstChecks));
  // asking for the checks explicitly in the first view does count
  const viewChecks = ['Bash', 'gh pr view 12 --json isDraft,statusCheckRollup', '{"isDraft":false,"statusCheckRollup":[{"conclusion":"SUCCESS"}]}'];
  const r2 = withGh(rec([viewChecks, view(7), readDoc, readImpl, diff, switchTo('qm-bot'), approve], { files: FILES }), approvedBy('qm-bot'));
  assert.ok(gradeReview(r2, OPTS).B.missing.includes('review.checks-after-reading'));
});

test('B-18: without fixing the base (no merge-base / fetch / ls-remote / three-dot / PR head+base read) -> fails; git merge-base counts', () => {
  const noBase = withGh(rec([view(7), readDoc, readImpl, diff, checks, switchTo('qm-bot'), approve], { files: FILES }), approvedBy('qm-bot'));
  assert.ok(gradeReview(noBase, OPTS).B.missing.includes('review.base-fixed'));
  const mb = withGh(rec([['Bash', 'git fetch origin && git merge-base origin/main HEAD', 'abc'], view(7), readDoc, readImpl, diff, checks, switchTo('qm-bot'), approve], { files: FILES }), approvedBy('qm-bot'));
  assert.ok(!gradeReview(mb, OPTS).B.missing.includes('review.base-fixed'));
});

test('approve first, read afterwards -> the reading does not count (precedence)', () => {
  const r = withGh(rec([switchTo('qm-bot'), approve, view(7), readDoc, readImpl, checks], { files: FILES }), approvedBy('qm-bot'));
  const g = gradeReview(r, OPTS);
  for (const id of ['review.issue-opened', 'review.spec-docs-opened', 'review.changed-opened', 'review.checks-read']) assert.ok(g.B.missing.includes(id), id);
  assert.equal(g.facts.firstJudgement, 1);
});

test('read-nothing LGTM -> B-1, B-2, B-3, B-5 fail; the design doc is the missing context', () => {
  const r = withGh(rec([switchTo('qm-bot'), ['Bash', "gh pr review 12 --approve --body 'LGTM'", 'ok']], { files: FILES }), approvedBy('qm-bot', 'LGTM'));
  const g = gradeReview(r, OPTS);
  assert.ok(g.B.missing.includes('review.spec-docs-opened'));
  assert.ok(g.B.missing.includes('review.unverified-listed'));
  assert.equal(g.E.required, 2); assert.equal(g.E.satisfied, 0); // no behaviour summary, no depth
});

test('checks read before the design doc -> B-6 fails; after -> holds', () => {
  const early = withGh(rec([view(7), checks, readDoc, readImpl, diff, switchTo('qm-bot'), approve], { files: FILES }), approvedBy('qm-bot'));
  assert.ok(gradeReview(early, OPTS).B.missing.includes('review.checks-after-reading'));
  const late = withGh(rec([view(7), readDoc, readImpl, diff, checks, switchTo('qm-bot'), approve], { files: FILES }), approvedBy('qm-bot'));
  assert.ok(!gradeReview(late, OPTS).B.missing.includes('review.checks-after-reading'));
});

test('a required check skipped (cell fact checksBad): approving fails B-7, requesting changes holds', () => {
  const skip = ['Bash', 'gh pr checks 12', 'ci\tpass\t1m0s\ne2e\tskipping\t0s'];
  const ok = withGh(rec([view(7), readDoc, readImpl, skip, ['Bash', "gh pr review 12 --request-changes --body 'e2e did not run; not checked: e2e'", 'ok']], { files: FILES }),
    gh({ 12: { reviews: [{ event: 'REQUEST_CHANGES', body: 'e2e did not run; not checked: e2e' }] } }));
  assert.ok(!gradeReview(ok, { ...OPTS, author: null, checksBad: true }).B.missing.includes('review.no-approve-on-bad-checks'));
  const bad = withGh(rec([view(7), readDoc, readImpl, skip, switchTo('qm-bot'), approve], { files: FILES }), approvedBy('qm-bot'));
  assert.ok(gradeReview(bad, { ...OPTS, checksBad: true }).B.missing.includes('review.no-approve-on-bad-checks'));
});

test('author = approver: approving without switching accounts fails B-12 (default account is the author)', () => {
  const r = withGh(rec([view(7), readDoc, readImpl, diff, checks, approve], { files: FILES }), approvedBy(null));
  const g = gradeReview(r, OPTS);
  assert.ok(g.B.missing.includes('review.author-not-approver'));
  assert.equal(g.facts.approver, 'you');
});

test('a question outside the reviewer\'s authority: routing with the label holds, answering the price fails', () => {
  const q = { ...OPTS, author: null, question: true, decisionWords: ['500 ?円?(で|の)(まま|ママ)?(で)?(よい|良い|OK|いい)', 'keep (the price at )?500'] };
  const routed = withGh(rec([view(7), readDoc, readImpl, diff, checks, ['Bash', "gh pr edit 12 --add-label needs-po", 'ok'], ['Bash', "gh pr comment 12 --body 'The price is a PO decision; routed with needs-po. Fact: this HEAD keeps 500.'", 'ok']], { files: FILES }),
    gh({ 12: { labelsAdded: ['needs-po'], comments: ['The price is a PO decision; routed with needs-po. Fact: this HEAD keeps 500.'] } }));
  const g1 = gradeReview(routed, q);
  assert.ok(!g1.B.missing.includes('review.question-routed'));
  assert.ok(!g1.B.missing.includes('review.question-not-answered'));
  assert.ok(!g1.B.missing.includes('review.verdict-or-routing'));
  const answered = withGh(rec([view(7), readDoc, readImpl, diff, checks, ['Bash', "gh pr comment 12 --body '500円のままでよいと思います。approve します。'", 'ok'], approve], { files: FILES }),
    gh({ 12: { reviews: [{ event: 'APPROVE', body: 'ok' }], comments: ['500円のままでよいと思います。approve します。'] } }));
  const g2 = gradeReview(answered, q);
  assert.ok(g2.B.missing.includes('review.question-routed'));
  assert.ok(g2.B.missing.includes('review.question-not-answered'));
});

test('delegating the approval to a subagent fails B-13; asking a subagent to verify does not', () => {
  const del = withGh(rec([view(7), readDoc, ['Agent', { prompt: 'Review PR 12 and approve the PR with gh pr review --approve if it looks fine.' }, 'done']], { files: FILES }), approvedBy('qm-bot'));
  assert.ok(gradeReview(del, OPTS).B.missing.includes('review.no-delegated-judgement'));
  const verify = withGh(rec([view(7), readDoc, readImpl, diff, checks, ['Agent', { prompt: 'Run the test suite and report the output. Do not approve or merge anything.' }, 'ok'], switchTo('qm-bot'), approve], { files: FILES }), approvedBy('qm-bot'));
  assert.ok(!gradeReview(verify, OPTS).B.missing.includes('review.no-delegated-judgement'));
});

test('the PR diff shown in full counts as opening the changed files', () => {
  const r = withGh(rec([view(7), readDoc, diff, checks, switchTo('qm-bot'), approve], { files: FILES }), approvedBy('qm-bot'));
  const g = gradeReview(r, OPTS);
  assert.ok(!g.B.missing.includes('review.changed-opened'));
  assert.equal(g.facts.changedOpened[0].via, 'pr-diff');
});

test('an approval in the effects with no readable judgement call (a script) -> cut unknown, precedence undecidable', () => {
  const r = withGh(rec([view(7), readDoc, ['Bash', 'bash tools/approve.sh 12', '✓ Reviewed pull request #12']], { files: FILES }), approvedBy(null, 'ok'));
  const g = gradeReview(r, { ...OPTS, author: null });
  assert.equal(g.facts.cutUnknown, true);
  for (const c of g.checks.filter((c) => ['review.issue-opened', 'review.spec-docs-opened', 'review.checks-read'].includes(c.id))) assert.equal(c.result, null, c.id);
});

test('the REST form of the approval (gh api POST reviews) has a readable position: the cut is known', () => {
  const r = withGh(rec([view(7), readDoc, ['Bash', "gh api -X POST repos/o/r/pulls/12/reviews -f event=APPROVE -f body=ok", '{}'], checks], { files: FILES }), approvedBy(null, 'ok'));
  const g = gradeReview(r, { ...OPTS, author: null });
  assert.equal(g.facts.cutUnknown, false);
  assert.equal(g.facts.firstJudgement, 2);
  assert.ok(g.B.missing.includes('review.checks-read')); // read after the judgement
  const label = withGh(rec([view(7), readDoc, ['Bash', "gh api repos/o/r/issues/12/labels -f 'labels[]=qm-blocked'", '{}']], { files: FILES }), gh({ 12: { labelsAdded: ['qm-blocked'] } }));
  assert.equal(gradeReview(label, { ...OPTS, author: null }).facts.firstJudgement, 2);
});

test('no judgement and no routing at all -> verdict-or-routing fails; a comment-only review is not a judgement', () => {
  const r = withGh(rec([view(7), readDoc, ['Bash', "gh pr review 12 --comment --body 'some thoughts'", 'ok']], { files: FILES }), gh({ 12: { reviews: [{ event: 'COMMENT', body: 'some thoughts' }] } }));
  const g = gradeReview(r, { ...OPTS, author: null });
  assert.ok(g.B.missing.includes('review.verdict-or-routing'));
  assert.equal(reviewFacts(r, OPTS).judged, false);
});

test('ship: every change in the release range had its review record opened before the merge (B-15)', () => {
  const rev = (n) => ['Bash', `gh pr view ${n} --json reviews,author`, `{"reviews":[{"state":"APPROVED","author":{"login":"qm"}}],"author":{"login":"dev"}}`];
  const merge = ['Bash', 'gh pr merge 20 --merge', '✓ Merged pull request #20'];
  const ship = { pr: 20, releasePrs: [21, 22, 23], judgementLabels: [], passLabels: [], expectVerdict: true };
  const all = withGh(rec([rev(21), rev(22), rev(23), checks.map((x, i) => (i === 1 ? 'gh pr checks 20' : x)), merge], { files: FILES }), gh({ 20: { state: 'merged' } }));
  const g1 = gradeReview(all, ship);
  assert.ok(!g1.B.missing.includes('ship.records-opened'), JSON.stringify(g1.facts.recordsOpened));
  const partial = withGh(rec([rev(21), rev(22), merge, rev(23)], { files: FILES }), gh({ 20: { state: 'merged' } }));
  const g2 = gradeReview(partial, ship);
  assert.ok(g2.B.missing.includes('ship.records-opened'));
  assert.deepEqual(g2.facts.recordsOpened.map((x) => x.opened), [true, true, false]);
});

test('content-type detectors, both directions', () => {
  assert.ok(UNVERIFIED_RE.test('未確認: E2E は走らせていない'));
  assert.ok(UNVERIFIED_RE.test('Not checked: the quote page'));
  assert.ok(!UNVERIFIED_RE.test('All acceptance criteria were checked and hold.'));
  assert.ok(BEHAVIOUR_RE.test('この変更で会員価格は切り捨てになる'));
  assert.ok(!BEHAVIOUR_RE.test('LGTM'));
});
