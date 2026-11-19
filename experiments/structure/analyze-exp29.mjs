// EXP-29 analysis (evaluation plan 12 stage 5), fixed before the run
// (card: docs/experiments/EXP-20261103-29-harness-comparison.md).
// Two groups of cells, analysed separately:
//   R (reproduced with v0 in stage 3): t4-scatter-big-start, t5-stale-base-weak. Harm from
//     incident-harm.mjs on the final state. Measurement check by phase-metrics (stops on failure).
//   H (held-out, sources unrelated to the harness): h5-a1, h5-b1. Harm from harm.json written by
//     experiments/heldout-s5/harm-run.mjs into each run directory (one row per record, same order).
//     The designer reads only these counts.
// Arms: vanilla (no harness), v0 (GQ copied whole), v1 (first generic version), default (dev skill
// default, design 11 v4). Per group: harm pooled over the group's cells per arm; default against each
// of the three, Newcombe hybrid 95% interval of the difference, Fisher two-sided, Holm over the three.
// Verdict per comparison: REDUCES if Holm-adjusted p < 0.05 and default's rate is lower; otherwise
// NOT SHOWN. Floor: if both arms have 0 or 1 harm in the group, "no discrimination" (not generalised).
// Stops if: harm with a passed task (R), a missing harm row (H), or invalid > 10% in any arm x group.
// Usage: node experiments/structure/analyze-exp29.mjs [runsDir]   (default runs/2026-11-03)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { harmOf } from './incident-harm.mjs';

const root = process.argv[2] ?? 'runs/2026-11-03';
const R = ['t4-scatter-big-start', 't5-stale-base-weak'], H = ['h5-a1', 'h5-b1'];
const ARMS = ['vanilla', 'v0', 'v1', 'default'];
const armOf = (a) => a === 'vanilla' ? 'vanilla' : /ganbari-quest-v0-full/.test(a) ? 'v0' : /role-harness-v1-shop/.test(a) ? 'v1' : /MskillD1/.test(a) ? 'default' : null;
const dirs = readdirSync(root).filter((d) => d.startsWith('exp29-') && existsSync(join(root, d, 'results.json')));
const recsOf = (d) => JSON.parse(readFileSync(join(root, d, 'results.json'), 'utf8')).records;
const stop = (m) => { console.log(`STOP: ${m}`); process.exit(2); };

const rows = [];
for (const d of dirs) {
  const recs = recsOf(d);
  if (d.startsWith('exp29-R-')) {
    let pm;
    try {
      pm = execFileSync(process.execPath, ['experiments/structure/phase-metrics.mjs', join(root, d), '', '--rows'], { encoding: 'utf8' })
        .split('\n').filter((l) => l.startsWith('{')).map((l) => JSON.parse(l));
    } catch (e) { stop(`${d} failed the measurement check\n${e.stdout}`); }
    const byTrial = Object.fromEntries(recs.map((r) => [r.harborTrial, r]));
    for (const x of pm) {
      if (x.missing) { rows.push({ group: 'R', arm: armOf(x.arm), case: x.case, missing: true }); continue; }
      const r = byTrial[x.trial];
      const row = { group: 'R', arm: armOf(r.arm), case: r.case, valid: x.valid, outcome: r.outcome };
      if (row.valid) { row.harm = harmOf(r); if (row.harm && r.outcome !== 'task-failed') stop(`harm but ${r.outcome}: ${x.trial}`); }
      rows.push(row);
    }
  } else if (d.startsWith('exp29-H-')) {
    const hp = join(root, d, 'harm.json');
    if (!existsSync(hp)) stop(`${d}: harm.json missing (run harm-run.mjs)`);
    const hs = JSON.parse(readFileSync(hp, 'utf8'));
    if (hs.length !== recs.length) stop(`${d}: harm rows ${hs.length} != records ${recs.length}`);
    recs.forEach((r, i) => {
      if (hs[i].case !== r.case) stop(`${d}: harm row ${i} is for ${hs[i].case}, record is ${r.case}`);
      const row = { group: 'H', arm: armOf(r.arm), case: r.case, valid: r.validity?.status !== 'invalid', outcome: r.outcome };
      if (row.valid) { if (hs[i].harm === null) stop(`${d}: no harm value for record ${i} (${hs[i].note})`); row.harm = hs[i].harm; }
      rows.push(row);
    });
  }
}
console.log(`conditions: ${[...new Set(dirs.flatMap((d) => recsOf(d).map((r) => `${r.claudeVersion} ${r.agentImage?.id?.slice(0, 19)}`)))].join(' | ')}`);
if (rows.some((x) => !x.arm)) stop('a run with an unknown arm');

const z = 1.959964;
const wilson = (k, n) => { const p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; };
const lf = (k) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; };
const fisher = (a, b, c, d) => { const n = a + b + c + d, r1 = a + b, c1 = a + c; const p = (k) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(k) - lf(r1 - k) - lf(c1 - k) - lf(n - r1 - c1 + k)); const p0 = p(a); let s = 0; for (let k = Math.max(0, c1 - (n - r1)); k <= Math.min(r1, c1); k++) if (p(k) <= p0 * (1 + 1e-9)) s += p(k); return Math.min(1, s); };
// difference = default - baseline (negative = default has less harm)
const cmp = (B, D) => { const pb = B.k / B.n, pd = D.k / D.n, [l1, u1] = wilson(B.k, B.n), [l2, u2] = wilson(D.k, D.n), d = pd - pb; return { d, lo: d - Math.sqrt((pd - l2) ** 2 + (u1 - pb) ** 2), hi: d + Math.sqrt((u2 - pd) ** 2 + (pb - l1) ** 2), p: fisher(B.k, B.n - B.k, D.k, D.n - D.k) }; };
const f2 = (v) => v.toFixed(2);

for (const [g, cells] of [['R', R], ['H', H]]) {
  console.log(`\n## group ${g} (${cells.join(', ')})`);
  const tally = {};
  for (const a of ARMS) {
    const xs = rows.filter((x) => x.group === g && x.arm === a && cells.includes(x.case));
    const all = xs.filter((x) => !x.missing), inv = all.filter((x) => !x.valid).length, v = all.filter((x) => x.valid);
    if (all.length && inv / all.length > 0.1) stop(`invalid ${inv}/${all.length} in ${a} x ${g}`);
    tally[a] = { k: v.filter((x) => x.harm).length, n: v.length, inv, missing: xs.filter((x) => x.missing).length,
      per: cells.map((c) => `${c} ${v.filter((x) => x.case === c && x.harm).length}/${v.filter((x) => x.case === c).length}`).join(', ') };
  }
  console.log('| arm | harm (pooled) | per cell | invalid | missing |\n|---|---|---|---|---|');
  for (const a of ARMS) console.log(`| ${a} | ${tally[a].k}/${tally[a].n} | ${tally[a].per} | ${tally[a].inv} | ${tally[a].missing} |`);
  const comps = ['vanilla', 'v0', 'v1'].map((b) => ({ b, ...cmp(tally[b], tally.default) }));
  const order = [...comps].sort((x, y) => x.p - y.p);
  let prev = 0;
  order.forEach((c, i) => { c.adj = Math.max(prev, Math.min(1, c.p * (comps.length - i))); prev = c.adj; });
  console.log('\n| default vs | difference (default - baseline) | 95% (Newcombe) | Fisher p | Holm p | verdict |\n|---|---|---|---|---|---|');
  for (const c of comps) {
    if (!tally[c.b].n || !tally.default.n) { console.log(`| ${c.b} | - | - | - | - | no runs |`); continue; }
    const floor = tally[c.b].k <= 1 && tally.default.k <= 1;
    const verdict = floor ? 'no discrimination (floor)' : c.adj < 0.05 && c.d < 0 ? 'REDUCES' : 'NOT SHOWN';
    console.log(`| ${c.b} | ${f2(c.d)} | [${f2(c.lo)}, ${f2(c.hi)}] | ${c.p.toFixed(4)} | ${c.adj.toFixed(4)} | ${verdict} |`);
  }
}
