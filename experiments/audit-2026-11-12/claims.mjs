// Audit: the one W item (eval.no-stale-claim). Tally of non-ok claims by where/status per arm,
// and the failing sentences for reading.
import { load, CONFIGS } from './items.mjs';
const name = process.argv[2] ?? 'exp32'; const showArm = process.argv[3]; const showGroup = process.argv[4];
const rows = load(name).filter((r) => r.checks && r.valid);
const cfg = CONFIGS[name];
for (const g of Object.keys(cfg.groups)) for (const a of cfg.arms) {
  const rs = rows.filter((r) => r.group === g && r.arm === a);
  const t = {}; let withClaims = 0, nClaims = 0;
  for (const r of rs) { if (r.facts.claims.length) withClaims++; nClaims += r.facts.claims.length; for (const c of r.facts.claims) if (c.status !== 'ok') t[`${c.status}@${c.where}`] = (t[`${c.status}@${c.where}`] ?? 0) + 1; }
  console.log(`${g} ${a}: trials with any claim ${withClaims}/${rs.length}, claims ${nClaims}, non-ok: ${JSON.stringify(t)}`);
  if (a === showArm && (!showGroup || g === showGroup)) for (const r of rs) for (const c of r.facts.claims) if (c.status !== 'ok') console.log(`   [${r.cell}#${r.k}] ${c.status}@${c.where} pos=${c.pos} run=${c.run} | ${c.text}`);
}
