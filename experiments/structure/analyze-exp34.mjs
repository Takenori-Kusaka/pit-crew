// EXP-34 analysis, fixed before the run (card: docs/experiments/EXP-20261104-34-job-selection.md).
// Error per trial from experiments/jobsel/judge.mjs errorOf(record). Q1: default vs vanilla, v0, v1
// (Fisher two-sided, Holm). Q2: v5 vs default (Fisher two-sided). Stops if a planned run is missing
// or incomplete, or invalid > 10% in an arm.
// Usage: node experiments/structure/analyze-exp34.mjs [runsDir]   (default runs/2026-11-04)
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { errorOf } from '../jobsel/judge.mjs';

const root = process.argv[2] ?? 'runs/2026-11-04';
const CELLS = ['js-1a', 'js-1b', 'js-2a', 'js-2b'], ARMS = ['vanilla', 'v0', 'v1', 'default', 'v5'], N = 10;
const stop = (m) => { console.log(`STOP: ${m}`); process.exit(2); };
const lf = (k) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; };
const fisher = (a, b, c, d) => { const n = a + b + c + d, r1 = a + b, c1 = a + c; const p = (k) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(k) - lf(r1 - k) - lf(c1 - k) - lf(n - r1 - c1 + k)); const p0 = p(a); let s = 0; for (let k = Math.max(0, c1 - (n - r1)); k <= Math.min(r1, c1); k++) if (p(k) <= p0 * (1 + 1e-9)) s += p(k); return Math.min(1, s); };
const tally = {};
for (const a of ARMS) {
  const t = { k: 0, n: 0, inv: 0, types: {}, per: {} };
  for (const c of CELLS) {
    const p = join(root, `exp34-${c}-${a}`, 'results.json');
    if (!existsSync(p)) stop(`missing run exp34-${c}-${a}`);
    const recs = JSON.parse(readFileSync(p, 'utf8')).records;
    if (recs.length !== N) stop(`exp34-${c}-${a}: ${recs.length}/${N} records`);
    let ck = 0, cn = 0;
    for (const r of recs) {
      if (r.validity?.status === 'invalid') { t.inv++; continue; }
      const e = errorOf(r);
      t.n++; cn++;
      if (e) { t.k++; ck++; t.types[e] = (t.types[e] ?? 0) + 1; }
    }
    t.per[c] = `${ck}/${cn}`;
  }
  if (t.inv / (CELLS.length * N) > 0.1) stop(`invalid ${t.inv} in ${a}`);
  tally[a] = t;
}
console.log('| arm | errors | per cell | error types | invalid |\n|---|---|---|---|---|');
for (const a of ARMS) console.log(`| ${a} | ${tally[a].k}/${tally[a].n} | ${CELLS.map((c) => `${c} ${tally[a].per[c]}`).join(', ')} | ${JSON.stringify(tally[a].types)} | ${tally[a].inv} |`);
const cmp = (x, y) => fisher(tally[x].k, tally[x].n - tally[x].k, tally[y].k, tally[y].n - tally[y].k);
const verdict = (x, y, p) => (tally[x].k <= 1 && tally[y].k <= 1 ? 'floor' : p < 0.05 && tally[x].k / tally[x].n < tally[y].k / tally[y].n ? 'REDUCES' : 'NOT SHOWN');
const q1 = ['vanilla', 'v0', 'v1'].map((b) => ({ b, p: cmp('default', b) }));
const o = [...q1].sort((x, y) => x.p - y.p); let prev = 0;
o.forEach((c, i) => { c.adj = Math.max(prev, Math.min(1, c.p * (q1.length - i))); prev = c.adj; });
console.log('\nQ1 | default vs | Fisher p | Holm p | verdict |\n|---|---|---|---|---|');
for (const c of q1) console.log(`| ${c.b} | ${c.p.toFixed(4)} | ${c.adj.toFixed(4)} | ${verdict('default', c.b, c.adj)} |`);
const p2 = cmp('v5', 'default');
console.log(`\nQ2 v5 vs default: v5 ${tally.v5.k}/${tally.v5.n}, default ${tally.default.k}/${tally.default.n}, Fisher p ${p2.toFixed(4)}, ${verdict('v5', 'default', p2)}`);
