// Auditor: fixed-seed sample of 15 trials per arm per experiment (spread over cells), with the evidence a
// hand audit needs. Output is auditor-only (it shows cell content). Read-only on runs / specs / grader.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { eventTable } from '../../packages/pit-wall/src/graders/process/events.mjs';

const ARMS = ['vanilla', 'v0', 'v1', 'default'];
const rows = JSON.parse(readFileSync('experiments/audit-2026-11-12/qm-regrade.json', 'utf8')).filter((r) => r.valid && !r.excluded);
const vr = Object.fromEntries(JSON.parse(readFileSync('experiments/audit-2026-11-12/qm-variants.json', 'utf8')).map((r) => [`${r.exp}|${r.cell}|${r.arm}|${r.k}`, r]));
const specs = { exp42: JSON.parse(readFileSync('experiments/qm/process-spec.json', 'utf8')), exp43: JSON.parse(readFileSync('experiments/qm-heldout/process-spec.json', 'utf8')) };
const verd = Object.fromEntries([...JSON.parse(readFileSync('experiments/qm/verdicts.json', 'utf8')), ...JSON.parse(readFileSync('experiments/qm-heldout/verdicts.json', 'utf8'))].map((v) => [v.case, v]));
const cache = new Map();
const rec = (r) => { const p = join('runs/2026-11-05', `${r.exp}-${r.cell}-${r.arm}`, 'results.json'); if (!cache.has(p)) cache.set(p, JSON.parse(readFileSync(p, 'utf8')).records); return cache.get(p)[r.k]; };
let s = 20261112; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
const rx = (x) => new RegExp(x);
const one = (t, n) => String(t ?? '').replace(/\s+/g, ' ').slice(0, n);
const sample = [];
for (const exp of ['exp42', 'exp43']) for (const arm of ARMS) {
  const pool = rows.filter((r) => r.exp === exp && r.arm === arm);
  const cells = [...new Set(pool.map((r) => r.cell))];
  const picked = [];
  let ci = Math.floor(rnd() * cells.length);
  while (picked.length < 15) {
    const c = cells[ci++ % cells.length];
    const cand = pool.filter((r) => r.cell === c && !picked.includes(r));
    if (cand.length) picked.push(cand[Math.floor(rnd() * cand.length)]);
  }
  sample.push(...picked);
}
const lines = [];
for (const r of sample) {
  const R = rec(r), spec = specs[r.exp][r.cell], t = eventTable(R), v = vr[`${r.exp}|${r.cell}|${r.arm}|${r.k}`];
  const cut = r.facts.firstJudgement ?? Infinity;
  const pre = t.events.filter((e) => e.pos < cut);
  const src = (e) => e.command ?? JSON.stringify(e.input);
  const item = R.state.gh?.items?.[String(spec.pr)] ?? {};
  const F = Object.entries(r.checks).filter(([id, x]) => x === false && r.series[id] === 'B').map(([id]) => id.replace(/^review\./, ''));
  lines.push(`\n## ${r.exp} ${r.cell} ${r.arm} #${r.k} | expected ${verd[r.cell].verdict} | ok=${r.ok} harm=[${r.harm}] | effect: ${(item.reviews ?? []).map((x) => `${x.event}/${x.by ?? '-'}`).join(',') || 'no review'} labels=[${(item.labelsAdded ?? []).join(',')}] comments=${(item.comments ?? []).length} | cut=${r.facts.firstJudgement}`);
  lines.push(`   registered reason: ${one(verd[r.cell].reason, 230)}`);
  lines.push(`   B false: ${F.join(', ') || '-'}`);
  for (const f of F) {
    if (f === 'issue-opened') { const any = t.events.filter((e) => rx(String.raw`gh\s+issue|issues/|issue-${spec.issue}`).test(src(e))); lines.push(`     issue: ${any.length ? any.map((e) => `${e.pos}${e.pos < cut ? '' : '(after cut)'}: ${one(src(e), 120)}`).join(' || ') : 'no command touching the issue anywhere'}`); }
    if (f === 'checks-read') lines.push(`     checks: on screen before cut = ${v.checksOnScreen}; review text cites CI = ${/CI|statusCheckRollup|checks|検査/.test(JSON.stringify(item.reviews ?? []))}`);
    if (f === 'no-edits') lines.push(`     edits: ${JSON.stringify(r.facts.edits.map((e) => e.what))} | end-state changes = [${v.changed}] HEAD moved = ${v.headMoved} | cmd: ${one(t.events.filter((e) => r.facts.edits.some((x) => Math.floor(x.pos) === e.i)).map(src).join(' || '), 260)}`);
    if (f === 'ship.records-opened') lines.push(`     records: ${JSON.stringify(r.facts.recordsOpened.map((x) => `${x.pr}:${x.opened ? 'T' : 'F'}`))} | pr-view loops: ${one(pre.filter((e) => /for \w+ in [0-9 ]+/.test(src(e))).map((e) => (src(e).match(/for \w+ in [0-9 ]+/) ?? [''])[0]).join(' | '), 160)} | release range numbers on screen = ${spec.releasePrs.every((n) => pre.some((e) => rx(String.raw`#${n}\b`).test(e.resultText)))}`);
    if (f === 'changed-opened') lines.push(`     changed: ${JSON.stringify(r.facts.changedOpened)} | diff routes before cut: ${[['gh pr diff', /gh\s+pr\s+diff/], ['cache diff file', /diff-\d+\.patch/], ['git diff/show', /git\s+(diff|show)/]].filter(([, re]) => pre.some((e) => re.test(src(e)))).map(([n]) => n).join(', ') || 'none'}`);
    if (f === 'spec-docs-opened') lines.push(`     docs: ${JSON.stringify(r.facts.docsOpened)}`);
    if (f === 'checks-after-reading') lines.push(`     order: firstChecks=${r.facts.firstChecks}`);
    if (f === 'verdict-or-routing') lines.push(`     no gh judgement. comment: ${one((item.comments ?? []).join(' // '), 260) || '(none)'} | final: ${one(R.trajectory.final_message, 160)}`);
  }
  const bodies = (item.reviews ?? []).map((x) => x.body ?? '').join('\n');
  const sev = bodies.split('\n').filter((l) => /S1|S2|差し戻|request|止め|理由|blocked|承認しない|回付|route|ask:/i.test(l)).slice(0, 4).map((l) => one(l, 210));
  if ((item.reviews ?? []).some((x) => x.event === 'REQUEST_CHANGES') || (item.labelsAdded ?? []).some((l) => /blocked|route|ask/.test(l))) lines.push(`   stated grounds: ${sev.join(' ¦ ') || one(bodies, 300)}`);
}
writeFileSync('experiments/audit-2026-11-12/qm-sample.auditor-only.txt', lines.join('\n'));
console.log(sample.length, 'trials;', lines.join('\n').length, 'chars');
const per = {}; for (const r of sample) (per[`${r.exp}|${r.arm}`] ??= []).push(`${r.cell.replace(/^qmh?-/, '')}#${r.k}`);
for (const [k, x] of Object.entries(per)) console.log(k, x.join(' '));
