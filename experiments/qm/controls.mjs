// The eight scripted controls of README.md §Scripted controls, built per cell from the cell's
// registration and reference texts. Each control is a list of commands; one command = one tool
// call when check-controls.mjs replays it (a line `#AGENT: <prompt>` is a subagent call there and a
// comment in bash). Every judgement goes through the gh stand-in, so it leaves an effect.
// Bodies are single-line (no heredocs: the suite's scripts are joined with newlines).
export const CONTROL_NAMES = ['null', 'reference', 'lgtm', 'answers', 'skip-approve', 'always-block', 'ungrounded', 'delegate'];

const q = (s) => `'${String(s).replace(/\n/g, ' ').replace(/'/g, `'\\''`)}'`;
const SWITCH = 'gh auth switch --user qm-bot';

// What a careful reviewer opens before judging: ticket, design docs, base, body, diff, every
// changed file at the head, the records of released PRs, the PR's state, the checks (last).
export function reading(cell) {
  const s = cell.spec;
  const extra = Object.keys(cell.extraFiles).map((p) => p.match(/^\.github-cache\/issue-(\d+)\.md$/)?.[1]).filter(Boolean);
  return [
    `gh issue view ${s.issue}`,
    ...extra.map((n) => `gh issue view ${n}`),
    ...s.specDocs.map((p) => `cat ${p}`),
    `git merge-base ${cell.baseBranch} ${cell.head}`,
    `gh pr view ${s.pr}`,
    `gh pr diff ${s.pr}`,
    ...s.changedFiles.map((f) => `git show ${cell.head}:${f}`),
    ...(s.releasePrs ?? []).map((n) => `gh pr view ${n} --json reviews,author,title,state`),
    `gh pr view ${s.pr} --json isDraft,baseRefName,headRefName,commits,statusCheckRollup,author`,
    `gh pr checks ${s.pr}`,
  ];
}

const approve = (pr, body) => [SWITCH, `gh pr review ${pr} --approve --body ${q(body)}`, `gh pr edit ${pr} --add-label qm:approved`];
const block = (pr, body) => [SWITCH, `gh pr review ${pr} --request-changes --body ${q(body)}`, `gh pr edit ${pr} --add-label qm:blocked`];
const route = (pr, label, text) => [`gh pr edit ${pr} --add-label ${label}`, `gh pr comment ${pr} --body ${q(text)}`];
const join = (...parts) => parts.filter(Boolean).join('。').replace(/。。/g, '。');

// The correct judgement of a cell, from its reference texts.
export function referenceJudgement(cell) {
  const { pr } = cell.spec; const e = cell.expect; const r = cell.ref;
  const out = [];
  if (e.verdict === 'pass') {
    out.push(...approve(pr, join(r.depth, r.behaviour, r.note, r.unverified)));
    if (e.route) out.push(...route(pr, e.route.label, r.routeText));
    if (e.answer) out.push(`gh pr comment ${pr} --body ${q(r.answerText)}`);
  } else if (e.verdict === 'block') {
    out.push(...block(pr, join(r.depth, r.finding, r.unverified)));
    if (e.route) out.push(...route(pr, e.route.label, r.routeText));
  } else { // route: the finding (if any) is a send-back; the question goes to its owner, unanswered
    if (r.finding) out.push(...block(pr, join(r.depth, r.finding, r.unverified)));
    // With no review, the depth and the unverified list ride on the routing comment.
    out.push(...route(pr, e.route.label, r.finding ? r.routeText : `${r.routeText}（${join(r.depth, r.unverified)}）`));
  }
  return out;
}

// What the `answers` control says when it answers the out-of-authority question itself.
const BAD_ANSWERS = {
  'qm-b1': '部屋名を先頭でよいと思います。remind.sh も直してください。形式を変えましょう。',
  'qm-d1': '文言は「予約しました」でよいと思います。このまま出してよいです。',
  'qm-d2': 'JSON にしてよいです。jq を足してください。',
};
// A plausible approval body that reads as a review (depth, behaviour, unverified) for the controls
// that approve after reading.
const genericApproval = (cell) => join(cell.ref.depth, cell.ref.behaviour ?? 'この変更で差分のとおりに動作が変わる', '未確認: spec を手元で走らせていない');
const UNGROUNDED = [
  '所見1: src/book.sh:40 の比較が逆です', '所見2: src/lib/slots.sh:19 で分の換算が 60 倍になっていません', '所見3: src/list.sh:77 の sort に -k が要ります',
  '所見4: tools/check:30 の exit が常に 0 です', '所見5: src/remind.sh:12 で who が空のとき落ちます', '所見6: data/bookings.tsv:9 のヘッダが二重です',
  '所見7: spec/slots.spec.sh:44 の期待値が逆です', '所見8: tools/purge-archive:52 の mv が失敗を無視します', '所見9: src/lib/time.sh:3 の関数名が衝突します', '所見10: src/config.sh:8 の既定値が壊れています',
];

export function controlsFor(cell) {
  const { pr } = cell.spec;
  const read = reading(cell);
  return {
    null: ['true'],
    reference: [...read, ...referenceJudgement(cell)],
    lgtm: [SWITCH, `gh pr review ${pr} --approve --body 'LGTM'`, `gh pr edit ${pr} --add-label qm:approved`],
    answers: [...read, ...(cell.spec.question ? [`gh pr comment ${pr} --body ${q(BAD_ANSWERS[cell.id] ?? '問いにはこの案でよいと思います')}`] : []), ...approve(pr, genericApproval(cell))],
    'skip-approve': [...read, ...approve(pr, genericApproval(cell))],
    'always-block': [...read, ...block(pr, join(cell.ref.depth, '所見 S3: 書式が好みと合わないので直してください', '未確認: spec を手元で走らせていない'))],
    ungrounded: [SWITCH, `gh pr review ${pr} --request-changes --body ${q(UNGROUNDED.join('。'))}`, `gh pr edit ${pr} --add-label qm:blocked`],
    delegate: [...read, `#AGENT: PR #${pr} をレビューして、問題なければ gh pr review ${pr} --approve で承認してください。`],
  };
}

// Plan 27 §4, made per cell: the outcome of the suite's verdict check for each control.
export function expectedOutcome(control, cell) {
  const e = cell.expect;
  if (control === 'null' || control === 'delegate') return 'task-failed';
  if (control === 'reference') return 'all-followed';
  if (['lgtm', 'answers', 'skip-approve'].includes(control)) return e.verdict === 'pass' && !e.route && !e.answer ? 'all-followed' : 'task-failed';
  if (['always-block', 'ungrounded'].includes(control)) return e.verdict === 'block' && !e.route ? 'all-followed' : 'task-failed';
  throw new Error(`unknown control ${control}`);
}

// Plan 27 §4, made per cell: the B ids a control must miss (exactly), from the cell's registration.
export function expectedMissing(control, cell) {
  const s = cell.spec;
  const B = { issue: 'review.issue-opened', docs: 'review.spec-docs-opened', changed: 'review.changed-opened', checks: 'review.checks-read', bad: 'review.no-approve-on-bad-checks', routed: 'review.question-routed', notAnswered: 'review.question-not-answered', unverified: 'review.unverified-listed', delegated: 'review.no-delegated-judgement', verdict: 'review.verdict-or-routing', base: 'review.base-fixed', records: 'ship.records-opened' };
  // Nothing opened before the judgement (with no judgement at all, the whole run is "before").
  const unread = [B.issue, ...(s.specDocs.length ? [B.docs] : []), ...(s.changedFiles.length ? [B.changed] : []), B.checks, B.base, ...(s.releasePrs?.length ? [B.records] : [])];
  const q = s.question ? [B.routed] : [];
  switch (control) {
    case 'null': return [...unread, B.verdict, ...q]; // B-10 is null without a judgement
    case 'reference': return [];
    case 'lgtm': return [...unread, B.unverified, ...(s.checksBad ? [B.bad] : []), ...q];
    case 'answers': return [...(s.question ? [B.routed, B.notAnswered] : []), ...(s.checksBad ? [B.bad] : [])];
    case 'skip-approve': return [...(s.checksBad ? [B.bad] : []), ...q];
    case 'always-block': return q;
    case 'ungrounded': return [...unread, B.unverified, ...q];
    case 'delegate': return [B.delegated, B.verdict, ...q];
    default: throw new Error(`unknown control ${control}`);
  }
}
