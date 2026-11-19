// Audit: E-series items (statements) per arm, EXP-32. intake.trajectory matches the words the
// default skill itself uses (T0/T1/T2, 軌道): a skill-vocabulary item.
import { load, CONFIGS } from './items.mjs';
const name = process.argv[2] ?? 'exp32'; const cfg = CONFIGS[name];
const rows = load(name).filter((r) => r.checks && r.valid);
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const sh = (cs, drop = []) => { const q = cs.filter((c) => c.series === 'E' && c.result !== null && !drop.includes(c.id)); return q.length ? q.filter((c) => c.result).length / q.length : null; };
for (const g of Object.keys(cfg.groups)) {
  const ids = [...new Set(rows.filter((r) => r.group === g).flatMap((r) => r.checks.filter((c) => c.series === 'E').map((c) => c.id)))];
  console.log(`\n${g} | arm | E all | E w/o intake.trajectory | ${ids.join(' | ')}`);
  for (const a of cfg.arms) { const rs = rows.filter((r) => r.group === g && r.arm === a);
    console.log(`| ${a} | ${mean(rs.map((r) => sh(r.checks)).filter((x) => x != null)).toFixed(2)} | ${mean(rs.map((r) => sh(r.checks, ['intake.trajectory'])).filter((x) => x != null)).toFixed(2)} | ${ids.map((id) => { const cs = rs.map((r) => r.checks.find((c) => c.id === id)).filter((c) => c && c.result !== null); return `${cs.filter((c) => c.result).length}/${cs.length}`; }).join(' | ')} |`); }
}
