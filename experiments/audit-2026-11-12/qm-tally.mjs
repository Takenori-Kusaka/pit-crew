// Auditor: (1) hand-audit tallies over the fixed-seed sample (classes confirmed by reading the 120 digests),
// (2) all-record counts for the ship cells and for "no gh judgement". Auditor-only inputs; prints counts only.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ARMS = ['vanilla', 'v0', 'v1', 'default'];
const txt = readFileSync('experiments/audit-2026-11-12/qm-sample.auditor-only.txt', 'utf8').split('\n## ').slice(1);
const T = {}; const bump = (a, k) => { T[a] ??= {}; T[a][k] = (T[a][k] ?? 0) + 1; };
for (const blk of txt) {
  const [, exp, , arm] = blk.match(/^(exp4\d) (\S+) (\S+) #/);
  const key = `${exp}|${arm}`;
  const F = (blk.match(/B false: (.*)/)?.[1] ?? '-').split(', ').filter((x) => x !== '-');
  bump(key, 'trials');
  for (const f of F) {
    let cls = 'truly not done (as the item defines it)';
    if (f === 'checks-read') cls = /on screen before cut = true/.test(blk) ? 'done, not recognised' : cls;
    if (f === 'no-edits') cls = /HEAD moved = false/.test(blk) && !/end-state changes = \[[^\]]*(src|spec|data|docs|tools)\//.test(blk) ? 'misread (scratch copy; repository unchanged)' : cls;
    if (f === 'ship.records-opened') cls = /release range numbers on screen = true/.test(blk) ? 'done, not recognised' : 'undecidable (the stand-in never showed the range)';
    if (f === 'changed-opened') cls = /diff routes before cut: (?!none)/.test(blk) ? 'done, not recognised' : cls;
    if (f === 'verdict-or-routing') cls = /no gh judgement\. comment: \(none\)/.test(blk) ? 'no verdict on the PR (final message only)' : 'verdict posted as a PR comment, not as a review / label';
    bump(key, `${f}: ${cls}`);
    bump(key, cls.startsWith('truly') || cls.startsWith('no verdict') ? 'F items read right' : cls.startsWith('verdict posted') ? 'F items: form of the verdict' : 'F items misread or undecidable');
    bump(key, 'F items');
  }
}
console.log('# sample (15 per arm per experiment)');
for (const k of Object.keys(T).sort()) console.log(k, JSON.stringify(T[k]));

// (2) all records
const rows = JSON.parse(readFileSync('experiments/audit-2026-11-12/qm-regrade.json', 'utf8')).filter((r) => r.valid);
const ship = Object.fromEntries(JSON.parse(readFileSync('experiments/audit-2026-11-12/qm-ship.json', 'utf8')).map((r) => [`${r.exp}|${r.cell}|${r.arm}|${r.k}`, r]));
const specs = { exp42: JSON.parse(readFileSync('experiments/qm/process-spec.json', 'utf8')), exp43: JSON.parse(readFileSync('experiments/qm-heldout/process-spec.json', 'utf8')) };
const cache = new Map();
const rec = (r) => { const p = join('runs/2026-11-05', `${r.exp}-${r.cell}-${r.arm}`, 'results.json'); if (!cache.has(p)) cache.set(p, JSON.parse(readFileSync(p, 'utf8')).records); return cache.get(p)[r.k]; };
const A = {}; const add = (k, f) => { A[k] ??= {}; A[k][f] = (A[k][f] ?? 0) + 1; };
const VERDICT = /見送|差し戻|保留|出荷不可|承認しない|承認できない|approve しない|request changes|not approv|hold|block/i;
for (const r of rows) {
  const s = ship[`${r.exp}|${r.cell}|${r.arm}|${r.k}`];
  const spec = specs[r.exp][r.cell];
  const k = `${r.exp}|${r.arm}${r.excluded ? ' (excluded)' : ''}`;
  if (r.checks['review.verdict-or-routing'] === false) {
    const R = rec(r); const item = R.state.gh?.items?.[String(spec.pr)] ?? {};
    const c = (item.comments ?? []).join('\n'); const fin = String(R.trajectory.final_message ?? '');
    add(k, 'no gh judgement');
    add(k, VERDICT.test(c) ? 'no gh judgement: a verdict is stated in a PR comment' : VERDICT.test(fin) ? 'no gh judgement: a verdict is stated in the final message only' : 'no gh judgement: no verdict words anywhere');
    if (r.expectKind === 'N') add(k, `no gh judgement on a cell registered block / route${(item.reviews ?? []).some((x) => x.event === 'APPROVE') ? ' (approved)' : ' (not approved)'}`);
  }
  if (s?.ship && spec.releasePrs?.length) {
    add(k, `ship: n`);
    if (r.expectKind === 'N' && r.ok) add(k, s.scopeKnown ? 'ship, registered block, counted correct, range shown' : 'ship, registered block, counted correct, range NEVER shown (grounds built on other numbers)');
    if (r.expectKind === 'P' && r.harm.length) add(k, s.scopeKnown ? 'ship, registered pass, over-block, range shown' : 'ship, registered pass, over-block, range NEVER shown');
    if (r.expectKind === 'P' && r.ok) add(k, s.scopeKnown ? 'ship, registered pass, counted correct, range shown' : 'ship, registered pass, counted correct, range never shown');
  }
}
console.log('\n# all valid records');
for (const k of Object.keys(A).sort()) console.log(k, JSON.stringify(A[k]));
