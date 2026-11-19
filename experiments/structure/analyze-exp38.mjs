// EXP-38 analysis, fixed before the run (card: docs/experiments/EXP-20261104-38-adapter-conformance.md).
// Per trial: followed all graded keys (1) / not (0) / undecidable (missing). default vs vanilla,
// Fisher two-sided, pooled over the cells listed in runs/.../exp38-cells.txt; per-cell rows descriptive.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { adapterConformance, keysOf } from '../subject2/adapter-check.mjs';

const root = process.argv[2] ?? 'runs/2026-11-04';
const cells = readFileSync(join(root, 'exp38-cells.txt'), 'utf8').replace(/^cells:\s*/, '').trim().split(/\s+/).filter(Boolean);
const ARMS = ['vanilla', 'default'];
const stop = (m) => { console.log(`STOP: ${m}`); process.exit(2); };
const lf = (k) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; };
const fisher = (a, b, c, d) => { const n = a + b + c + d, r1 = a + b, c1 = a + c; const p = (k) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(k) - lf(r1 - k) - lf(c1 - k) - lf(n - r1 - c1 + k)); const p0 = p(a); let s = 0; for (let k = Math.max(0, c1 - (n - r1)); k <= Math.min(r1, c1); k++) if (p(k) <= p0 * (1 + 1e-9)) s += p(k); return Math.min(1, s); };
const t = {};
for (const a of ARMS) {
  t[a] = { k: 0, n: 0, und: 0, inv: 0, per: {}, keys: {} };
  for (const c of cells) {
    const p = join(root, `exp38-${c}-${a}`, 'results.json');
    if (!existsSync(p)) stop(`missing exp38-${c}-${a}`);
    const recs = JSON.parse(readFileSync(p, 'utf8')).records;
    if (recs.length !== 10) stop(`exp38-${c}-${a}: ${recs.length}/10`);
    let ck = 0, cn = 0;
    for (const r of recs) {
      if (r.validity?.status === 'invalid') { t[a].inv++; continue; }
      const conf = adapterConformance(r);
      const graded = keysOf(c).map((k) => [k, conf[k]]);
      if (graded.some(([, v]) => v === 'undecidable')) { t[a].und++; continue; }
      const ok = graded.every(([, v]) => v === 'followed');
      for (const [k, v] of graded) { t[a].keys[k] ??= { f: 0, n: 0 }; t[a].keys[k].n++; if (v === 'followed') t[a].keys[k].f++; }
      t[a].n++; cn++; if (ok) { t[a].k++; ck++; }
    }
    t[a].per[c] = `${ck}/${cn}`;
  }
  if (t[a].inv / (cells.length * 10) > 0.1) stop(`invalid ${t[a].inv} in ${a}`);
}
console.log(`cells: ${cells.join(', ')}\n| arm | followed all graded keys | per cell | undecidable | invalid |\n|---|---|---|---|---|`);
for (const a of ARMS) console.log(`| ${a} | ${t[a].k}/${t[a].n} | ${cells.map((c) => `${c} ${t[a].per[c]}`).join(', ')} | ${t[a].und} | ${t[a].inv} |`);
console.log('\n| key | vanilla | default |\n|---|---|---|');
for (const k of [...new Set(ARMS.flatMap((a) => Object.keys(t[a].keys)))]) console.log(`| ${k} | ${t.vanilla.keys[k] ? `${t.vanilla.keys[k].f}/${t.vanilla.keys[k].n}` : '-'} | ${t.default.keys[k] ? `${t.default.keys[k].f}/${t.default.keys[k].n}` : '-'} |`);
const p = fisher(t.default.k, t.default.n - t.default.k, t.vanilla.k, t.vanilla.n - t.vanilla.k);
const rd = t.default.k / t.default.n, rv = t.vanilla.k / t.vanilla.n;
const v = rd >= 0.9 && rv >= 0.9 ? 'ceiling' : p < 0.05 && rd > rv ? 'FOLLOWS MORE' : 'NOT SHOWN';
console.log(`\ndefault ${t.default.k}/${t.default.n} vs vanilla ${t.vanilla.k}/${t.vanilla.n}, Fisher p ${p.toFixed(4)}: ${v}`);
