// EXP-36 analysis, fixed before the run (card: docs/experiments/EXP-20261104-36-v5b-process.md).
// Non-inferiority of v5b vs default on B share (process precedence) pooled over 3 cells: bootstrap
// 95% lower bound of (v5b - default) > -0.05.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] ?? 'runs/2026-11-04';
const CELLS = { 't5-stale-base-weak': 'experiments/process/spec-dev-cells.json', 'h5-a1': 'experiments/heldout-s5/process-spec.json', 'd3-3': 'experiments/d3/process-spec.json' };
const rows = { default: [], v5b: [] };
for (const [c, spec] of Object.entries(CELLS)) for (const a of Object.keys(rows)) {
  const p = join(root, `exp36-${c}-${a}`, 'results.json');
  if (!existsSync(p)) { console.log(`STOP: missing exp36-${c}-${a}`); process.exit(2); }
  const out = JSON.parse(execFileSync(process.execPath, ['packages/pit-wall/src/graders/process/cli.mjs', p, '--spec', spec, '--json'], { encoding: 'utf8', maxBuffer: 1 << 28 }));
  const inv = out.rows.filter((r) => !r.valid).length;
  if (inv > 2) { console.log(`STOP: invalid ${inv}/20 in ${c} x ${a}`); process.exit(2); }
  for (const r of out.rows.filter((r) => r.valid)) rows[a].push({ c, s: r.B?.share ?? 0, f: !!r.failureObserved });
}
let seed = 20261104; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const d = rows.v5b.map((x) => x.s), b = rows.default.map((x) => x.s);
const ds = []; for (let i = 0; i < 10000; i++) ds.push(mean(d.map(() => d[Math.floor(rnd() * d.length)])) - mean(b.map(() => b[Math.floor(rnd() * b.length)])));
ds.sort((x, y) => x - y);
const lo = ds[250], hi = ds[9749], diff = mean(d) - mean(b);
for (const c of Object.keys(CELLS)) console.log(`${c}: default ${mean(rows.default.filter((x) => x.c === c).map((x) => x.s)).toFixed(2)} (n ${rows.default.filter((x) => x.c === c).length}), v5b ${mean(rows.v5b.filter((x) => x.c === c).map((x) => x.s)).toFixed(2)} (n ${rows.v5b.filter((x) => x.c === c).length})`);
console.log(`failure observed: default ${rows.default.filter((x) => x.f).length}/${rows.default.length}, v5b ${rows.v5b.filter((x) => x.f).length}/${rows.v5b.length}`);
console.log(`pooled B share: default ${mean(b).toFixed(3)}, v5b ${mean(d).toFixed(3)}, difference ${diff.toFixed(3)} [${lo.toFixed(3)}, ${hi.toFixed(3)}]`);
console.log(lo > -0.05 ? 'NON-INFERIOR (adopt condition met)' : 'NOT SHOWN non-inferior');
