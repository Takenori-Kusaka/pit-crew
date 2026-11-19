// EXP-32 analysis, fixed before the run (card: docs/experiments/EXP-20261104-32-process-conformance.md).
// Per group (dev / held-out / D3): grade every run directory exp32-<group>-<case>-<arm> with the
// stage-0a process CLI and that group's registration; primary = per-trial B.share; default against
// vanilla, v0, v1: mean difference, bootstrap 95% interval, two-sided permutation p, Holm over 3.
// Verdict RAISES / NOT SHOWN / ceiling. Secondary columns are printed but not judged.
// Stops if a run is missing its registration, or invalid > 10% in any arm x group.
// Usage: node experiments/structure/analyze-exp32.mjs [runsDir]   (default runs/2026-11-04)
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] ?? 'runs/2026-11-04';
const GROUPS = {
  dev: { cells: ['t4-scatter-big-start', 't5-stale-base-weak'], spec: 'experiments/process/spec-dev-cells.json' },
  heldout: { cells: ['h5-a1', 'h5-b1', 'h5-c1', 'h5-d1'], spec: 'experiments/heldout-s5/process-spec.json' },
  d3: { cells: ['d3-3', 'd3-4'], spec: 'experiments/d3/process-spec.json' },
};
const ARMS = ['vanilla', 'v0', 'v1', 'default'];
const stop = (m) => { console.log(`STOP: ${m}`); process.exit(2); };
let seed = 20261104;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const perm = (a, b, P = 10000) => {
  const obs = Math.abs(mean(a) - mean(b)), all = [...a, ...b];
  let k = 0;
  for (let p = 0; p < P; p++) {
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    if (Math.abs(mean(all.slice(0, a.length)) - mean(all.slice(a.length))) >= obs - 1e-12) k++;
  }
  return (k + 1) / (P + 1);
};
const boot = (a, b, B = 10000) => {
  const ds = [];
  for (let i = 0; i < B; i++) {
    const ra = a.map(() => a[Math.floor(rnd() * a.length)]), rb = b.map(() => b[Math.floor(rnd() * b.length)]);
    ds.push(mean(ra) - mean(rb));
  }
  ds.sort((x, y) => x - y);
  return [ds[Math.floor(0.025 * B)], ds[Math.floor(0.975 * B)]];
};
const holm = (ps) => { const o = ps.map((p, i) => [p, i]).sort((x, y) => x[0] - y[0]); const adj = []; let prev = 0; o.forEach(([p, i], r) => { prev = Math.max(prev, Math.min(1, p * (ps.length - r))); adj[i] = prev; }); return adj; };
const f2 = (v) => v.toFixed(2);

const dirs = existsSync(root) ? readdirSync(root).filter((d) => d.startsWith('exp32-') && existsSync(join(root, d, 'results.json'))) : [];
for (const [g, { cells, spec }] of Object.entries(GROUPS)) {
  if (!existsSync(spec)) stop(`${g}: registration ${spec} missing`);
  const rows = {};
  for (const a of ARMS) {
    const files = dirs.filter((d) => cells.some((c) => d === `exp32-${g}-${c}-${a}`)).map((d) => join(root, d, 'results.json'));
    if (!files.length) { rows[a] = []; continue; }
    const out = JSON.parse(execFileSync(process.execPath, ['packages/pit-wall/src/graders/process/cli.mjs', ...files, '--spec', spec, '--json'], { encoding: 'utf8', maxBuffer: 1 << 28 }));
    const inv = out.rows.filter((r) => !r.valid).length;
    if (out.rows.length && inv / out.rows.length > 0.1) stop(`invalid ${inv}/${out.rows.length} in ${a} x ${g}`);
    rows[a] = out.rows.filter((r) => r.valid);
  }
  console.log(`\n## group ${g} (${cells.join(', ')})`);
  console.log('| arm | n | B share (mean) | failure observed before fix | calls before first impl edit | N+X | U | E share | most-missing steps |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const a of ARMS) {
    const r = rows[a];
    if (!r.length) { console.log(`| ${a} | 0 | - | - | - | - | - | - | - |`); continue; }
    const cit = r.reduce((o, x) => { for (const [k, v] of Object.entries(x.cites ?? {})) o[k] = (o[k] ?? 0) + v; return o; }, {});
    const loc = Object.values(cit).reduce((s, v) => s + v, 0) || 1;
    const miss = {};
    r.forEach((x) => (x.B?.missing ?? []).forEach((m) => { miss[m] = (miss[m] ?? 0) + 1; }));
    const top = Object.entries(miss).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([m, k]) => `${m} ${k}`).join('; ');
    console.log(`| ${a} | ${r.length} | ${f2(mean(r.map((x) => x.B?.share ?? 0)))} | ${r.filter((x) => x.failureObserved).length}/${r.length} | ${f2(mean(r.map((x) => x.callsBeforeImpl ?? 0)))} | ${f2(((cit.N ?? 0) + (cit.X ?? 0)) / loc)} | ${f2((cit.U ?? 0) / loc)} | ${f2(mean(r.map((x) => x.E?.share ?? 0)))} | ${top} |`);
  }
  const d = (rows.default ?? []).map((x) => x.B?.share ?? 0);
  const comps = ['vanilla', 'v0', 'v1'].map((b) => {
    const o = (rows[b] ?? []).map((x) => x.B?.share ?? 0);
    if (!d.length || !o.length) return { b, none: true, p: 1 };
    return { b, diff: mean(d) - mean(o), ci: boot(d, o), p: perm(d, o), ceil: mean(d) >= 0.95 && mean(o) >= 0.95 };
  });
  const adj = holm(comps.map((c) => c.p));
  console.log('\n| default vs | difference (B share) | 95% bootstrap | permutation p | Holm p | verdict |\n|---|---|---|---|---|---|');
  comps.forEach((c, i) => {
    if (c.none) { console.log(`| ${c.b} | - | - | - | - | no runs |`); return; }
    const v = c.ceil ? 'ceiling' : adj[i] < 0.05 && c.diff > 0 ? 'RAISES' : 'NOT SHOWN';
    console.log(`| ${c.b} | ${f2(c.diff)} | [${f2(c.ci[0])}, ${f2(c.ci[1])}] | ${c.p.toFixed(4)} | ${adj[i].toFixed(4)} | ${v} |`);
  });
}
