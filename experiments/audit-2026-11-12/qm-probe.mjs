// Auditor probes on recognition: for items marked false, look for the same act in a form the grader does not parse.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eventTable } from '../../packages/pit-wall/src/graders/process/events.mjs';
const rows = JSON.parse(readFileSync('experiments/audit-2026-11-12/qm-regrade.json', 'utf8')).filter((r) => r.valid && !r.excluded);
const specs = { exp42: JSON.parse(readFileSync('experiments/qm/process-spec.json', 'utf8')), exp43: JSON.parse(readFileSync('experiments/qm-heldout/process-spec.json', 'utf8')) };
const cache = new Map();
const rec = (r) => { const p = join('runs/2026-11-05', `${r.exp}-${r.cell}-${r.arm}`, 'results.json'); if (!cache.has(p)) cache.set(p, JSON.parse(readFileSync(p, 'utf8')).records); return cache.get(p)[r.k]; };
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const tally = {};
const bump = (k) => { tally[k] = (tally[k] ?? 0) + 1; };
const detail = [];
for (const r of rows) {
  const R = rec(r), spec = specs[r.exp][r.cell], t = eventTable(R);
  const cut = r.facts.firstJudgement ?? Infinity;
  const pre = t.events.filter((e) => e.pos < cut);
  const key = (item, cls) => `${r.exp}|${item}|${r.arm}|${cls}`;
  if (r.checks['review.issue-opened'] === false) {
    const issueText = R.state.files[`.github-cache/issue-${spec.issue}.md`]; const txt = typeof issueText === 'string' ? issueText : issueText?.text;
    const lines = String(txt ?? '').split('\n').map(norm).filter((l) => l.length >= 12);
    const shown = (evs) => evs.some((e) => lines.some((l) => norm(e.resultText).includes(l)));
    const cmdIssue = (evs) => evs.filter((e) => /gh\s+issue|issues\/|issue-\d+\.md/.test(e.command ?? JSON.stringify(e.input)));
    const cls = shown(pre) ? 'issue text shown before cut (unrecognised form)' : shown(t.events) ? 'issue text shown only after cut' : cmdIssue(pre).length ? 'issue command before cut, text not shown' : cmdIssue(t.events).length ? 'issue command only after cut' : 'no issue access at all';
    bump(key('issue-opened', cls));
    if (cls.startsWith('issue text shown before') || cls.startsWith('issue command before')) detail.push({ r: `${r.exp} ${r.cell} ${r.arm} #${r.k}`, item: 'issue', cls, cmds: cmdIssue(pre).map((e) => `${e.pos}: ${(e.command ?? JSON.stringify(e.input)).slice(0, 200)}`) });
  }
  if (r.checks['ship.records-opened'] === false) {
    const missing = r.facts.recordsOpened.filter((x) => !x.opened).map((x) => x.pr);
    const mention = (evs, n) => evs.filter((e) => new RegExp(`(^|[^0-9])${n}([^0-9]|$)`).test(e.command ?? '') && /gh\s/.test(e.command ?? ''));
    const loop = pre.filter((e) => /gh\s+(pr\s+(view|list)|api)/.test(e.command ?? '') && /review/i.test(e.resultText) && /(for |\$|xargs|while |pr\s+list)/.test(e.command ?? ''));
    const anyAfter = t.events.filter((e) => e.pos >= cut && /gh\s+(pr\s+(view|list)|api)/.test(e.command ?? '') && /review/i.test(e.resultText));
    const direct = missing.filter((n) => mention(pre, n).some((e) => /review/i.test(e.resultText)));
    const cls = loop.length ? 'review records shown before cut via loop / variable / list (unrecognised form)' : direct.length === missing.length ? 'all missing PRs named in a gh call whose output mentions reviews (unrecognised form)' : anyAfter.length ? 'review records read only after the judgement' : pre.some((e) => /gh\s+pr\s+view/.test(e.command ?? '')) ? 'pr views before cut, none showing the missing records' : 'no access';
    bump(key('records-opened', cls));
    detail.push({ r: `${r.exp} ${r.cell} ${r.arm} #${r.k}`, item: 'records', cls, missing, cut, cmds: t.events.filter((e) => /gh\s+(pr|api)/.test(e.command ?? '')).map((e) => `${e.pos}: ${e.command.slice(0, 160).replace(/\n/g, ' ⏎ ')}`) });
  }
  if (r.checks['review.no-edits'] === false) for (const e of r.facts.edits) bump(key('no-edits', e.what.startsWith('git ') || e.what === 'commit' ? e.what : `write ${e.what.replace(/\d+/g, 'N')}`));
  if (r.checks['review.checks-read'] === false) {
    const ran = pre.filter((e) => /tools\/check|shellspec|bash\s+spec|make\s+(test|check)|npm\s+test/.test(e.command ?? ''));
    const ghChecks = t.events.filter((e) => /gh\s+pr\s+checks|statusCheckRollup|check-runs|checks-\d+\.txt|commits\/[^ ]+\/(status|check)/.test(e.command ?? JSON.stringify(e.input)));
    const cls = ghChecks.some((e) => e.pos < cut) ? 'a checks command before cut (unrecognised / empty output)' : ghChecks.length ? 'checks read only after the judgement' : ran.length ? 'no CI read; ran the checks locally before cut' : 'no checks access';
    bump(key('checks-read', cls));
    if (cls.startsWith('a checks command')) detail.push({ r: `${r.exp} ${r.cell} ${r.arm} #${r.k}`, item: 'checks', cls, cut, cmds: ghChecks.map((e) => `${e.pos}: ${(e.command ?? JSON.stringify(e.input)).slice(0, 200).replace(/\n/g, ' ⏎ ')} => ${e.resultText.slice(0, 80).replace(/\n/g, ' ⏎ ')}`) });
  }
}
for (const k of Object.keys(tally).sort()) console.log(k, tally[k]);
if (process.argv[2]) for (const d of detail.filter((x) => x.item === process.argv[2]).slice(0, Number(process.argv[3] ?? 20))) console.log(JSON.stringify(d, null, 1));
