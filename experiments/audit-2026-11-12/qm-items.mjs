// Per-item satisfaction per arm, and B share with item subsets dropped. Descriptive only.
import { readFileSync } from 'node:fs';
const rows = JSON.parse(readFileSync('experiments/audit-2026-11-12/qm-regrade.json', 'utf8')).filter((r) => r.valid && !r.excluded);
const ARMS = ['vanilla', 'v0', 'v1', 'default'];
const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
const share = (r, drop, overrides = {}) => { const ids = Object.keys(r.checks).filter((id) => r.series[id] === 'B' && !drop.includes(id)); const v = ids.map((id) => (id in overrides ? overrides[id](r) : r.checks[id])).filter((x) => x !== null); return v.length ? v.filter((x) => x === true).length / v.length : 0; };
const sets = JSON.parse(process.argv[2] ?? '{}');
const only = process.argv[3] ? process.argv[3].split(',') : null;
for (const exp of ['exp42', 'exp43']) {
  const R = rows.filter((r) => r.exp === exp && (!only || only.includes(r.cell)));
  const ids = [...new Set(R.flatMap((r) => Object.keys(r.checks)))];
  console.log(`\n## ${exp} items (satisfied / decidable; null = undecidable)`);
  console.log(`| item | series | ${ARMS.join(' | ')} |`);
  for (const id of ids) console.log(`| ${id} | ${R.find((r) => id in r.series).series[id]} | ${ARMS.map((a) => { const v = R.filter((r) => r.arm === a && id in r.checks).map((r) => r.checks[id]); const d = v.filter((x) => x !== null); return `${d.filter((x) => x).length}/${d.length}${v.length - d.length ? ` (null ${v.length - d.length})` : ''}`; }).join(' | ')} |`);
  console.log(`\n| variant | ${ARMS.join(' | ')} | d-vanilla | d-v0 | d-v1 |`);
  for (const [name, drop] of Object.entries({ published: [], ...sets })) {
    const m = Object.fromEntries(ARMS.map((a) => [a, mean(R.filter((r) => r.arm === a).map((r) => share(r, drop)))]));
    console.log(`| ${name} | ${ARMS.map((a) => m[a].toFixed(3)).join(' | ')} | ${['vanilla', 'v0', 'v1'].map((o) => (m.default - m[o] >= 0 ? '+' : '') + (m.default - m[o]).toFixed(3)).join(' | ')} |`);
  }
}
