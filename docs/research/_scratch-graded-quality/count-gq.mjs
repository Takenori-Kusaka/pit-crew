// Counts review / rework signals on the most recent merged PRs of the public repo
// Takenori-Kusaka/ganbari-quest through the gh CLI (GraphQL). Reads only public metadata:
// review states and times, commit times, label events, branch names. No bodies are stored.
// usage: node count-gq.mjs [pages=20]   (25 PRs per page; larger pages time out with HTTP 502)
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const pages = Number(process.argv[2] ?? 20);
const query = `query($cursor:String){repository(owner:"Takenori-Kusaka",name:"ganbari-quest"){
 pullRequests(states:MERGED,first:25,after:$cursor,orderBy:{field:UPDATED_AT,direction:DESC}){
  pageInfo{hasNextPage endCursor}
  nodes{number mergedAt createdAt headRefName baseRefName additions deletions changedFiles
   author{login}
   labels(first:20){nodes{name}}
   reviews(first:50){nodes{state submittedAt author{login}}}
   reviewThreads(first:1){totalCount}
   comments{totalCount}
   commits(first:100){totalCount nodes{commit{committedDate}}}
   timelineItems(itemTypes:[LABELED_EVENT],first:60){nodes{... on LabeledEvent{label{name} createdAt}}}
   closingIssuesReferences(first:5){totalCount nodes{labels(first:20){nodes{name}}}}
  }}}}`;

let cursor = null;
const prs = [];
for (let i = 0; i < pages; i++) {
  const args = ['api', 'graphql', '-f', `query=${query}`];
  if (cursor) args.push('-f', `cursor=${cursor}`);
  const out = JSON.parse(execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  const page = out.data.repository.pullRequests;
  prs.push(...page.nodes);
  if (!page.pageInfo.hasNextPage) break;
  cursor = page.pageInfo.endCursor;
}

const has = (pr, f) => (f(pr) ? 1 : 0);
const rows = prs.map((pr) => {
  const reviews = pr.reviews.nodes.filter((r) => r.submittedAt);
  const firstReview = reviews.map((r) => r.submittedAt).sort()[0];
  const changesReq = reviews.filter((r) => r.state === 'CHANGES_REQUESTED');
  const firstCR = changesReq.map((r) => r.submittedAt).sort()[0];
  const commitTimes = pr.commits.nodes.map((c) => c.commit.committedDate).sort();
  const after = (t) => (t ? commitTimes.filter((c) => c > t).length : 0);
  const labelEvents = pr.timelineItems.nodes.map((n) => n.label?.name).filter(Boolean);
  const issueLabels = pr.closingIssuesReferences.nodes.flatMap((n) => n.labels.nodes.map((l) => l.name));
  return {
    number: pr.number,
    mergedAt: pr.mergedAt,
    head: pr.headRefName,
    base: pr.baseRefName,
    author: pr.author?.login ?? null,
    lines: pr.additions + pr.deletions,
    files: pr.changedFiles,
    commits: pr.commits.totalCount,
    reviews: reviews.length,
    reviewers: [...new Set(reviews.map((r) => r.author?.login))].length,
    changesRequested: changesReq.length,
    commitsAfterFirstReview: after(firstReview),
    commitsAfterChangesRequested: after(firstCR),
    reviewThreads: pr.reviewThreads.totalCount,
    everQmBlocked: has(pr, () => labelEvents.includes('state:qm-blocked')),
    everNeedsDev: has(pr, () => labelEvents.includes('state:needs-dev')),
    hotfixBranch: has(pr, () => /^hotfix\//.test(pr.headRefName)),
    closesIssue: pr.closingIssuesReferences.totalCount,
    closesFixIssue: has(pr, () => issueLabels.includes('type:fix') || issueLabels.includes('bug')),
    closesCritical: has(pr, () => issueLabels.includes('priority:critical')),
  };
});

const n = rows.length;
const count = (f) => rows.filter(f).length;
const summary = {
  sampled: n,
  window: [rows.at(-1)?.mergedAt, rows[0]?.mergedAt],
  authors: Object.fromEntries(Object.entries(rows.reduce((a, r) => ((a[r.author] = (a[r.author] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1]).slice(0, 8)),
  withAnyReview: count((r) => r.reviews > 0),
  withChangesRequested: count((r) => r.changesRequested > 0),
  changesRequestedThenCommit: count((r) => r.commitsAfterChangesRequested > 0),
  commitAfterFirstReview: count((r) => r.commitsAfterFirstReview > 0),
  withReviewThreads: count((r) => r.reviewThreads > 0),
  reviewThreadsThenCommit: count((r) => r.reviewThreads > 0 && r.commitsAfterFirstReview > 0),
  everQmBlocked: count((r) => r.everQmBlocked),
  everQmBlockedThenCommit: count((r) => r.everQmBlocked && r.commitsAfterFirstReview > 0),
  everNeedsDev: count((r) => r.everNeedsDev),
  hotfixBranch: count((r) => r.hotfixBranch),
  closesFixIssue: count((r) => r.closesFixIssue),
  closesCritical: count((r) => r.closesCritical),
  // size bands of the rework candidates (lines changed), for a feasibility read
  reworkSmall: count((r) => r.commitsAfterChangesRequested > 0 && r.lines <= 400 && r.files <= 15),
  medianLines: rows.map((r) => r.lines).sort((a, b) => a - b)[Math.floor(n / 2)],
};
writeFileSync(new URL('./gq-pr-signals.json', import.meta.url), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 1));
