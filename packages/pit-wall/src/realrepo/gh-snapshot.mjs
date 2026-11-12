// The frozen snapshot the gh stand-in answers from (shims/realrepo/gh.mjs): the repository's
// issues and pull requests AS OF the pre-fix commit's date, built from a local cache of the
// public data (issues: number, title, body, createdAt, closedAt, lastEditedAt, author, labels;
// pull requests: number, title, body, createdAt, mergedAt, base / head, labels,
// closingIssuesReferences). The snapshot is subject content: it is written under local/ only.
//
// What goes in, and what is left out so that nothing from after the date gets through:
//   issues  created on or before the date; state and closedAt as of the date. An issue whose
//           text was edited after the date is left out (its text may be from the future), except
//           the task's own issue, whose text is the request in every arm anyway.
//   PRs     created on or before the date; MERGED when merged by then, OPEN when merged later;
//           a PR that never merged has no recorded state (the cache has no closing date).
//           The fix PR, and any PR that closes the task's issue, is left out.
//   never   comments, timelines, cross-references, reviews, checks: not recorded.
const iso = (s) => (s ? new Date(s).getTime() : null);
const names = (labels) => (Array.isArray(labels) ? labels : labels?.nodes ?? []).map((l) => ({ name: typeof l === 'string' ? l : l.name })).filter((l) => l.name);
const login = (a) => (a ? { login: typeof a === 'string' ? a : a.login ?? '' } : { login: '' });

export function buildSnapshot({ issues, prs }, { repo, asOf, taskIssue = null, fixPr = null, defaultBranch = null }) {
  const cut = iso(asOf);
  if (!Number.isFinite(cut)) throw new Error('buildSnapshot: asOf is not a date');
  const url = (kind, n) => `https://github.com/${repo}/${kind}/${n}`;
  const out = { repo, asOf: new Date(cut).toISOString(), defaultBranch, issuesComplete: false, issues: {}, prs: {}, labels: [], lastNumber: 0, meta: { issuesLeftOutEditedLater: 0, issuesAfterDate: 0, prsAfterDate: 0, prsLeftOutClosingTheIssue: 0, prsWithoutState: 0 } };
  const closes = (p) => (p.closingIssuesReferences?.nodes ?? p.closingIssuesReferences ?? []).some((r) => (r.number ?? r) === taskIssue);
  for (const i of issues) {
    if (iso(i.createdAt) > cut) { out.meta.issuesAfterDate++; continue; }
    out.lastNumber = Math.max(out.lastNumber, i.number);
    if (i.number !== taskIssue && i.lastEditedAt && iso(i.lastEditedAt) > cut) { out.meta.issuesLeftOutEditedLater++; continue; }
    const closed = i.closedAt && iso(i.closedAt) <= cut;
    out.issues[i.number] = { number: i.number, title: i.title, body: i.body ?? '', state: closed ? 'CLOSED' : 'OPEN', createdAt: i.createdAt, closedAt: closed ? i.closedAt : null, author: login(i.author), labels: names(i.labels), url: url('issues', i.number) };
  }
  for (const p of prs) {
    if (iso(p.createdAt) > cut) { out.meta.prsAfterDate++; continue; }
    out.lastNumber = Math.max(out.lastNumber, p.number);
    if (p.number === fixPr || (taskIssue != null && closes(p))) { out.meta.prsLeftOutClosingTheIssue++; continue; }
    const mergedBy = p.mergedAt && iso(p.mergedAt) <= cut;
    const state = mergedBy ? 'MERGED' : p.mergedAt ? 'OPEN' : undefined;
    if (state === undefined) out.meta.prsWithoutState++;
    out.prs[p.number] = { number: p.number, title: p.title, body: p.body ?? '', ...(state ? { state } : {}), createdAt: p.createdAt, mergedAt: mergedBy ? p.mergedAt : null, author: login(p.author), labels: names(p.labels), url: url('pull', p.number), baseRefName: p.baseRefName, headRefName: p.headRefName };
  }
  out.labels = [...new Set([...Object.values(out.issues), ...Object.values(out.prs)].flatMap((x) => x.labels.map((l) => l.name)))].sort();
  out.meta.issues = Object.keys(out.issues).length; out.meta.prs = Object.keys(out.prs).length;
  return out;
}
