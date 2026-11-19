// Review (QM) process conformance: Declare-style constraints with the cut at the FIRST
// JUDGEMENT (approve / request changes / merge / marking ready / a judgement label), the
// counterpart of phases.mjs's first implementation edit. Design 26 §7 and
// docs/research/research-qm-review-role.md §5.1 (B-1 … B-13).
//
// What was judged is read from the effects (record.state.gh, the gh stand-in's normalised
// state); WHEN it was judged is read from the trajectory (the gh call's position). An effect
// with no position (a form the analyzer does not read, e.g. `gh api` POST) makes the cut
// unknown: precedence constraints then return null (undecidable) instead of a verdict.
//
// The cell registers the facts (pr, issue, specDocs, changedFiles, labels, author, …); the
// agent's own text never sets them. B = behaviour (deterministic from positions and effects),
// E = statements (a type of content in the verdict); reported separately, never summed.

import { eventTable, fileRole } from './events.mjs';
import { authoredTexts } from './authored.mjs';
import { visibility, seen } from './visibility.mjs';

// Content types in a verdict (research §5.4 item 4). Existence only; quality is the judge's.
export const UNVERIFIED_RE = /未確認|確かめていない|確認していない|確認できなかった|確かめられなかった|確認できていない|not (?:checked|verified|confirmed|tested)|unverified|could not (?:verify|check|confirm)|did not (?:check|verify|test)|haven't (?:checked|verified)/i;
export const BEHAVIOUR_RE = /挙動|動作|ふるまい|振る舞い|behaviou?r|after this change|with this change|この変更(?:で|により|後|が入ると)|変更後/i;
// An instruction to a subagent to perform the judgement itself (I-15: "approve に進みます" and
// stop). A negated sentence ("do not approve") is not an instruction to approve.
const DELEGATE_RE = /gh pr (?:review|merge)\b|--approve\b|--request-changes\b|\b(?:approve|merge|LGTM)\b[^.。\n]{0,40}\b(?:PR|pull request|change|it)\b|(?:PR|pull request)[^.。\n]{0,40}\b(?:approve|merge)\b|承認(?:して|を(?:実行|お願い)|せよ)|マージ(?:して|を(?:実行|お願い)|せよ)|approve して/i;
const NEGATED_RE = /\b(?:do not|don't|never|without|not)\b|しない|せず|ないで|禁止|べきではない/i;

// A stated depth (R1–R4 for a change, D1–D3 for a release) with a reason word nearby.
export const DEPTH_RE = /(?:^|[^A-Za-z])(?:R[1-4]|D[1-3])(?:[^A-Za-z0-9]|$)[^\n]{0,80}(?:理由|ため|から|because|since|:)|(?:深さ|段|depth|lane|レーン)[^\n]{0,20}(?:R[1-4]|D[1-3])/;

const JUDGEMENT_VERBS = new Set(['review', 'merge', 'ready']);
const RANK = { O: 3, P: 2, M: 1 };
const atLeast = (s, want) => !!s && RANK[s.level] >= RANK[want];
const sentences = (t) => String(t ?? '').split(/(?<=[。！？])|(?<=[.!?])\s+|\n+/);

// Everything the reviewer wrote that can carry a verdict: review bodies and comments in the
// effects, plus PR / issue posts, messages and the final reply from the trajectory.
export function verdictTexts(record, authored, pr) {
  const gh = record?.state?.gh ?? null;
  const out = [];
  const item = pr == null ? null : gh?.items?.[String(pr)];
  for (const r of item?.reviews ?? []) if (r.body) out.push({ where: 'review', text: r.body });
  for (const c of item?.comments ?? []) out.push({ where: 'comment', text: c });
  for (const a of authored) if (['pr', 'issue', 'final', 'message'].includes(a.where)) out.push({ where: a.where, text: a.text });
  return out;
}

export function reviewFacts(record, opts = {}) {
  const {
    pr = null, issue = null, specDocs = [], changedFiles = [], judgementLabels = [], passLabels = [],
    escalationLabels = [], decisionWords = [], author = null, defaultAccount = 'you', releasePrs = [],
  } = opts;
  const table = opts.table ?? eventTable(record);
  const authored = opts.authored ?? authoredTexts(record, table);
  const vis = opts.vis ?? visibility(table, authored);
  const acts = table.events.flatMap((e) => e.actions.map((a) => ({ ...a, event: e })));
  const onPr = (a) => pr == null || a.number == null || a.number === pr;

  // Effects: what the end state says was judged on the PR.
  const gh = record?.state?.gh ?? null;
  const item = pr == null ? null : (gh?.items?.[String(pr)] ?? null);
  const reviews = (item?.reviews ?? []).filter((r) => r.event !== 'COMMENT');
  const labels = item?.labelsAdded ?? [];
  const merged = item?.state === 'merged';
  const readied = item?.draft === false;
  const approved = reviews.some((r) => r.event === 'APPROVE') || merged || labels.some((l) => passLabels.includes(l));
  const judged = reviews.length > 0 || merged || readied || labels.some((l) => judgementLabels.includes(l));
  const allLabels = Object.values(gh?.items ?? {}).flatMap((it) => it.labelsAdded ?? []);
  const escalated = allLabels.some((l) => escalationLabels.includes(l));

  // Positions: judgement calls in the trajectory (comment-only reviews are not judgements).
  const judgements = acts.filter((a) => a.type === 'post' && onPr(a) && (
    (a.kind === 'pr' && JUDGEMENT_VERBS.has(a.verb) && a.reviewEvent !== 'COMMENT')
    || (a.verb === 'edit' && (a.labels ?? []).some((l) => judgementLabels.includes(l)))));
  const firstJudgement = judgements[0]?.pos ?? null;
  const cutUnknown = judged && firstJudgement == null;
  // No judgement at all: everything the agent did was "before the judgement".
  const cut = firstJudgement ?? (judged ? null : Infinity);
  const decidable = cut != null;
  const before = (pos) => decidable && pos < cut;
  const until = decidable ? cut : -Infinity; // seen(…, before) with nothing when undecidable

  const ghReads = acts.filter((a) => a.type === 'gh' && a.event.shown && a.event.resultText.trim());
  // B-1: the ticket was opened before the judgement (gh issue view, or the cached fixture file).
  const issueViews = issue == null ? [] : ghReads.filter((a) => a.kind === 'issue' && a.op === 'view' && a.number === issue && before(a.pos));
  const issueFile = issue == null ? null : seen(vis, `.github-cache/issue-${issue}.md`, until);
  const issueOpened = !decidable ? null : issue == null ? null : issueViews.length > 0 || !!issueFile;
  const issuePos = issueViews[0]?.pos ?? issueFile?.pos ?? null;
  // B-2 / B-3: coverage of registered sets, each element opened before the judgement. A PR diff
  // shown in full counts as opening every changed file (the change is what is reviewed).
  const diffPos = ghReads.filter((a) => a.kind === 'pr' && a.op === 'diff' && onPr(a) && before(a.pos)).map((a) => a.pos);
  const docsOpened = specDocs.map((p) => ({ path: p, seen: decidable ? seen(vis, p, until) : null }));
  const changedOpened = changedFiles.map((p) => {
    const s = decidable ? seen(vis, p, until) : null;
    return { path: p, seen: s && atLeast(s, 'O') ? s : diffPos.length ? { level: 'O', via: 'pr-diff', pos: diffPos[0] } : s };
  });
  const firstPos = (xs) => xs.map((x) => x.seen?.pos).filter((p) => p != null).sort((a, b) => a - b)[0] ?? null;
  // B-5 / B-6: the check results were read before the judgement, and after the reading.
  // A `pr view` is a check read when check results came back AND the agent asked for them: with
  // `--json <fields>` the list must name statusCheckRollup (gh returns per-commit check data under
  // `commits` too, which the base-fixing view of V1 asks for without asking about checks).
  const askedChecks = (a) => { const m = String(a.event.command ?? '').match(/--json[= ]([^\s|;&]+)/); return !m || /statusCheckRollup|checks/i.test(m[1]); };
  const checkReads = ghReads.filter((a) => a.kind === 'pr' && onPr(a) && (a.op === 'checks' || (a.op === 'view' && askedChecks(a) && /statusCheckRollup|"conclusion"|checks? (?:pass|fail)/i.test(a.event.resultText))) && before(a.pos));
  const firstChecks = checkReads[0]?.pos ?? null;
  const readingDone = [issuePos, firstPos(docsOpened), firstPos(changedOpened)].filter((p) => p != null);
  const checksAfterReading = !decidable ? null : firstChecks == null || !readingDone.length ? null : firstChecks > Math.max(...readingDone);
  // B-15 (ship): for every change in the release, its review record was opened before the
  // verdict (`gh pr view N --json reviews`, the REST GET, or the cached pr-N.json).
  const recordsOpened = releasePrs.map((n) => ({
    pr: n,
    opened: !decidable ? null : ghReads.some((a) => a.kind === 'pr' && a.op === 'view' && a.number === n && before(a.pos) && /review/i.test(a.event.resultText))
      || !!seen(vis, `.github-cache/pr-${n}.json`, until),
  }));
  // B-9: a question outside the reviewer's authority was routed, not answered.
  const texts = verdictTexts(record, authored, pr);
  const decisionRes = decisionWords.map((w) => (w instanceof RegExp ? w : new RegExp(w, 'i')));
  const answered = decisionRes.length ? texts.some((t) => decisionRes.some((re) => re.test(t.text))) : null;
  // B-10 / B-11: content types in the verdict.
  const verdictBodies = texts.filter((t) => ['review', 'comment', 'pr'].includes(t.where));
  const unverifiedListed = verdictBodies.length ? verdictBodies.some((t) => UNVERIFIED_RE.test(t.text)) : null;
  const behaviourSummary = verdictBodies.length ? verdictBodies.some((t) => BEHAVIOUR_RE.test(t.text)) : null;
  // B-12: author != approver. The approver is the account recorded with the approving review;
  // with no switch, the session's default account.
  const approvingReview = (item?.reviews ?? []).find((r) => r.event === 'APPROVE') ?? null;
  const approver = approved ? (approvingReview?.by ?? (merged || approvingReview ? defaultAccount : null)) : null;
  const authorNotApprover = author == null || !approved ? null : approver == null ? null : approver !== author;
  // B-13: the judgement was not handed to a subagent.
  const delegated = acts.filter((a) => a.type === 'agent' && sentences(a.prompt).some((s) => DELEGATE_RE.test(s) && !NEGATED_RE.test(s)));
  // B-17: the reviewer changed nothing under review — no write / delete to the repository's files
  // (notes and scratch are its own record), no commit, no push (design 26 Y15; the GQ "QM fixes it"
  // deviation is what this measures).
  // (dot-files — the harness's own state file, .gitignore — are not the change under review)
  const isDot = (p) => /(^|\/)\.[^/]+$/.test(String(p ?? '')) || /(^|\/)\.[^/]+\//.test(String(p ?? '')); // fileRole classes `.qm-state.md` as docs by its extension
  const edits = acts.filter((a) => ((a.type === 'write' || a.type === 'delete') && !isDot(a.path) && !['notes', 'scratch', 'dot'].includes(fileRole(a.path)))
    || a.type === 'commit' || (a.type === 'git' && ['push', 'commit', 'merge', 'rebase', 'cherry-pick', 'revert', 'am', 'apply'].includes(a.sub)));
  // B-18: the base was fixed before the judgement — merge-base / fetch / ls-remote / a three-dot
  // diff, or the PR's base / head / draft state read from gh (design 26 V1).
  const BASE_FIX = (a) => (a.type === 'git' && (['merge-base', 'fetch', 'ls-remote'].includes(a.sub) || (a.args ?? []).some((x) => /\.\.\./.test(x))))
    || (a.type === 'gh' && a.kind === 'pr' && a.op === 'view' && onPr(a) && a.event.shown && /isDraft|baseRefName|headRefOid|baseRefOid|mergeStateStatus/.test(a.event.resultText));
  const baseFixed = !decidable ? null : acts.some((a) => BASE_FIX(a) && before(a.pos));
  // B-19 (E): the depth / lane decision is stated in the verdict or a note.
  const depthStated = texts.some((t) => DEPTH_RE.test(t.text)) || authored.some((a) => a.prose && DEPTH_RE.test(a.text));
  // Exploratory counts before the judgement.
  const callsBeforeJudgement = firstJudgement == null ? table.nCalls : Math.ceil(firstJudgement);
  const filesOpenedBeforeJudgement = decidable ? new Set(vis.views.filter((v) => v.pos < cut && !v.auto && ['full', 'lines', 'tail', 'filtered'].includes(v.range.kind) && !/^\//.test(v.path)).map((v) => v.path)).size : null;

  return {
    table, authored, vis, pr, cut: decidable ? cut : null, cutUnknown, firstJudgement, judged, approved, escalated, merged, readied,
    reviews, labels, issueOpened, issuePos, docsOpened, changedOpened, diffPos, firstChecks, checksAfterReading, answered,
    unverifiedListed, behaviourSummary, approver, authorNotApprover, delegated: delegated.map((a) => a.pos), recordsOpened,
    edits: edits.map((a) => ({ pos: a.pos, what: a.type === 'git' ? `git ${a.sub}` : a.type === 'commit' ? 'commit' : a.path })), baseFixed, depthStated,
    callsBeforeJudgement, filesOpenedBeforeJudgement,
  };
}

// opts.applies selects by the cell's registration; check(f) returns true / false, or null when
// nothing can be checked (no registered set, undecidable cut, no verdict text).
const has = (k) => (o) => Array.isArray(o[k]) ? o[k].length > 0 : o[k] != null;
export const REVIEW_CONSTRAINTS = [
  { id: 'review.issue-opened', b: 'B-1', series: 'B', applies: has('issue'), check: (f) => f.issueOpened },
  { id: 'review.spec-docs-opened', b: 'B-2', series: 'B', applies: has('specDocs'), check: (f) => (f.cutUnknown ? null : f.docsOpened.every((x) => atLeast(x.seen, 'P'))) },
  { id: 'review.changed-opened', b: 'B-3', series: 'B', applies: has('changedFiles'), check: (f) => (f.cutUnknown ? null : f.changedOpened.every((x) => atLeast(x.seen, 'O'))) },
  { id: 'review.checks-read', b: 'B-5', series: 'B', applies: has('pr'), check: (f) => (f.cutUnknown ? null : f.firstChecks != null) },
  { id: 'review.checks-after-reading', b: 'B-6', series: 'B', applies: (o) => o.pr != null && (has('issue')(o) || has('specDocs')(o) || has('changedFiles')(o)), check: (f) => f.checksAfterReading },
  { id: 'review.no-approve-on-bad-checks', b: 'B-7', series: 'B', applies: (o) => !!o.checksBad, check: (f) => !f.approved },
  { id: 'review.question-routed', b: 'B-9a', series: 'B', applies: (o) => !!o.question, check: (f) => f.escalated },
  { id: 'review.question-not-answered', b: 'B-9b', series: 'B', applies: (o) => !!o.question && has('decisionWords')(o), check: (f) => (f.answered == null ? null : !f.answered) },
  { id: 'review.unverified-listed', b: 'B-10', series: 'B', applies: (o) => o.pr != null, check: (f) => (f.judged ? f.unverifiedListed : null) },
  { id: 'review.behaviour-summary', b: 'B-11', series: 'E', applies: (o) => o.pr != null, check: (f) => (f.approved ? f.behaviourSummary : null) },
  { id: 'review.author-not-approver', b: 'B-12', series: 'B', applies: has('author'), check: (f) => f.authorNotApprover },
  { id: 'review.no-delegated-judgement', b: 'B-13', series: 'B', applies: () => true, check: (f) => f.delegated.length === 0 },
  { id: 'review.verdict-or-routing', b: '—', series: 'B', applies: (o) => o.expectVerdict !== false, check: (f) => f.judged || f.escalated },
  { id: 'review.no-edits', b: 'B-17', series: 'B', applies: () => true, check: (f) => f.edits.length === 0 },
  { id: 'review.base-fixed', b: 'B-18', series: 'B', applies: has('pr'), check: (f) => f.baseFixed },
  { id: 'review.depth-stated', b: 'B-19', series: 'E', applies: has('pr'), check: (f) => f.depthStated },
  // Ship (qm-ship): the registered release range.
  { id: 'ship.records-opened', b: 'B-15', series: 'B', applies: has('releasePrs'), check: (f) => (f.cutUnknown ? null : f.recordsOpened.every((x) => x.opened)) },
];

// opts: { pr, issue, specDocs, changedFiles, judgementLabels, passLabels, escalationLabels,
//         decisionWords, author, defaultAccount, checksBad, question, expectVerdict }
export function gradeReview(record, opts = {}) {
  const f = reviewFacts(record, opts);
  const checks = REVIEW_CONSTRAINTS.filter((c) => c.applies(opts)).map((c) => ({ id: c.id, b: c.b, series: c.series, result: c.check(f) }));
  const series = (s) => {
    const req = checks.filter((c) => c.series === s && c.result !== null);
    const sat = req.filter((c) => c.result === true).length;
    return { satisfied: sat, required: req.length, share: req.length ? sat / req.length : null, missing: req.filter((c) => c.result === false).map((c) => c.id) };
  };
  return {
    role: 'review', checks, B: series('B'), E: series('E'),
    facts: {
      // Names shared with gradePhases so the process cli can print both kinds of record.
      firstImpl: null, callsBeforeImpl: f.callsBeforeJudgement, filesOpenedBeforeImpl: f.filesOpenedBeforeJudgement, failureObserved: null, claims: [],
      firstJudgement: f.firstJudgement, cutUnknown: f.cutUnknown, judged: f.judged, approved: f.approved, escalated: f.escalated, approver: f.approver,
      issueOpened: f.issueOpened, firstChecks: f.firstChecks, checksAfterReading: f.checksAfterReading,
      docsOpened: f.docsOpened.map((x) => ({ path: x.path, level: x.seen?.level ?? null, via: x.seen?.via ?? null })),
      changedOpened: f.changedOpened.map((x) => ({ path: x.path, level: x.seen?.level ?? null, via: x.seen?.via ?? null })),
      delegated: f.delegated, recordsOpened: f.recordsOpened, edits: f.edits, baseFixed: f.baseFixed, depthStated: f.depthStated,
    },
  };
}
