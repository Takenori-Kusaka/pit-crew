// Audit: research.opened-changed = N. Which changed file was not fully visible before its first
// edit, at what level/via, and is that file one the agent itself listed as changed by a bulk edit
// (sed over a glob) or a mis-rolled scratch path.
import { load, CONFIGS } from './items.mjs';
const name = process.argv[2] ?? 'exp32'; const cfg = CONFIGS[name];
const rows = load(name).filter((r) => r.checks && r.valid);
for (const g of Object.keys(cfg.groups)) for (const a of cfg.arms) {
  const t = {};
  for (const r of rows.filter((x) => x.group === g && x.arm === a && x.checks.find((c) => c.id === 'research.opened-changed')?.result === false))
    for (const o of r.facts.openedChanged.filter((x) => x.level !== 'O')) { const k = `${r.cell} ${o.path} level=${o.level} via=${o.via}`; t[k] = (t[k] ?? 0) + 1; }
  if (Object.keys(t).length) console.log(`${g} ${a}: ${Object.entries(t).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${v}× ${k}`).join(' ; ')}`);
}
