// EXP-35 analysis, fixed before the run (card: docs/experiments/EXP-20261104-35-v5b-noninferiority.md).
// Non-inferiority of v5b vs default on job-selection errors: Newcombe hybrid 95% upper bound of
// (v5b - default) < 0.10 and over-escalation + omission of v5b <= 1.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { errorOf } from '../jobsel/judge.mjs';

const root = process.argv[2] ?? 'runs/2026-11-04';
const CELLS = ['js-1a', 'js-1b', 'js-2a', 'js-2b'];
const t = {};
for (const a of ['default', 'v5b']) {
  t[a] = { k: 0, n: 0, inv: 0, types: {} };
  for (const c of CELLS) {
    const p = join(root, `exp35-${c}-${a}`, 'results.json');
    if (!existsSync(p)) { console.log(`STOP: missing exp35-${c}-${a}`); process.exit(2); }
    for (const r of JSON.parse(readFileSync(p, 'utf8')).records) {
      if (r.validity?.status === 'invalid') { t[a].inv++; continue; }
      const e = errorOf(r); t[a].n++;
      if (e) { t[a].k++; t[a].types[e] = (t[a].types[e] ?? 0) + 1; }
    }
  }
  if (t[a].inv > 4) { console.log(`STOP: invalid ${t[a].inv} in ${a}`); process.exit(2); }
}
const z = 1.959964;
const wilson = (k, n) => { const p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; };
const pa = t.default.k / t.default.n, pb = t.v5b.k / t.v5b.n, [l1, u1] = wilson(t.default.k, t.default.n), [l2, u2] = wilson(t.v5b.k, t.v5b.n);
const d = pb - pa, hi = d + Math.sqrt((u2 - pb) ** 2 + (pa - l1) ** 2), lo = d - Math.sqrt((pb - l2) ** 2 + (u1 - pa) ** 2);
const esc = (t.v5b.types['over-escalation'] ?? 0) + (t.v5b.types.omission ?? 0);
console.log(`default ${t.default.k}/${t.default.n} ${JSON.stringify(t.default.types)} | v5b ${t.v5b.k}/${t.v5b.n} ${JSON.stringify(t.v5b.types)}`);
console.log(`difference v5b - default ${d.toFixed(3)} [${lo.toFixed(3)}, ${hi.toFixed(3)}]; v5b over-escalation+omission ${esc}`);
console.log(hi < 0.10 && esc <= 1 ? 'NON-INFERIOR (adopt condition met)' : 'NOT SHOWN non-inferior');
