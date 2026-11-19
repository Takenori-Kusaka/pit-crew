// Auditor: end-state check of review.no-edits. Per cell, the working-tree hash each trial ended with.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const rows = JSON.parse(readFileSync('experiments/audit-2026-11-12/qm-regrade.json', 'utf8')).filter((r) => r.valid && !r.excluded);
const cache = new Map();
const rec = (r) => { const p = join('runs/2026-11-05', `${r.exp}-${r.cell}-${r.arm}`, 'results.json'); if (!cache.has(p)) cache.set(p, JSON.parse(readFileSync(p, 'utf8')).records); return cache.get(p)[r.k]; };
const byCell = {};
for (const r of rows) { const R = rec(r); r.tree = R.state.finalTree; r.headMoved = R.state.git.head !== R.state.git.fixtureHead; r.stateFile = Object.keys(R.state.files).filter((f) => /qm-state|\.notes|notes\//.test(f)); (byCell[`${r.exp}|${r.cell}`] ??= []).push(r); }
const T = {};
const diffs = [];
for (const [c, rs] of Object.entries(byCell)) {
  const cnt = {}; for (const r of rs) cnt[r.tree] = (cnt[r.tree] ?? 0) + 1;
  const base = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0];
  for (const r of rs) {
    const k = `${r.exp}|${r.arm}`; T[k] ??= { n: 0, 'no-edits F': 0, 'no-edits F, tree = modal tree and HEAD unmoved': 0, 'no-edits F, tree differs': 0, 'no-edits T, tree differs': 0, 'HEAD moved': 0 };
    T[k].n++; const same = r.tree === base && !r.headMoved;
    if (r.headMoved) T[k]['HEAD moved']++;
    if (r.checks['review.no-edits'] === false) { T[k]['no-edits F']++; T[k][same ? 'no-edits F, tree = modal tree and HEAD unmoved' : 'no-edits F, tree differs']++; if (!same) diffs.push(`${r.exp} ${r.cell} ${r.arm} #${r.k} F ${JSON.stringify(r.facts.edits)}`); }
    else if (!same) { T[k]['no-edits T, tree differs']++; diffs.push(`${r.exp} ${r.cell} ${r.arm} #${r.k} T stateFiles=${r.stateFile}`); }
  }
}
for (const k of Object.keys(T).sort()) console.log(k, JSON.stringify(T[k]));
console.log(diffs.join('\n'));
