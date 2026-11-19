// EXP-37 analysis, fixed before the run (card: docs/experiments/EXP-20261104-37-citation-grounding.md).
// Primary: per-trial N+X share of located citations (trials with no citation are missing data,
// counted). default vs vanilla/v0/v1: bootstrap 95% CI of the mean difference, two-sided permutation
// p, Holm over 3. Stops on missing/incomplete runs or invalid > 10% in an arm.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] ?? 'runs/2026-11-04';
const CELLS = ['q2-1-retry-policy', 'q2-2-export-batch', 'q2-3-audit-prune'], ARMS = ['vanilla', 'v0', 'v1', 'default'], N = 10;
const stop = (m) => { console.log(`STOP: ${m}`); process.exit(2); };
let seed = 20261104; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const perm = (a, b, P = 10000) => { const obs = Math.abs(mean(a) - mean(b)), all = [...a, ...b]; let k = 0; for (let p = 0; p < P; p++) { for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; } if (Math.abs(mean(all.slice(0, a.length)) - mean(all.slice(a.length))) >= obs - 1e-12) k++; } return (k + 1) / (P + 1); };
const boot = (a, b, B = 10000) => { const ds = []; for (let i = 0; i < B; i++) ds.push(mean(a.map(() => a[Math.floor(rnd() * a.length)])) - mean(b.map(() => b[Math.floor(rnd() * b.length)]))); ds.sort((x, y) => x - y); return [ds[Math.floor(0.025 * B)], ds[Math.floor(0.975 * B)]]; };
const holm = (ps) => { const o = ps.map((p, i) => [p, i]).sort((x, y) => x[0] - y[0]); const adj = []; let prev = 0; o.forEach(([p, i], r) => { prev = Math.max(prev, Math.min(1, p * (ps.length - r))); adj[i] = prev; }); return adj; };
const f2 = (v) => v.toFixed(3);
const rows = {};
for (const a of ARMS) {
  const files = CELLS.map((c) => join(root, `exp37-${c}-${a}`, 'results.json'));
  for (const f of files) { if (!existsSync(f)) stop(`missing ${f}`); const n = JSON.parse(readFileSync(f, 'utf8')).records.length; if (n !== N) stop(`${f}: ${n}/${N}`); }
  const out = JSON.parse(execFileSync(process.execPath, ['packages/pit-wall/src/graders/process/cli.mjs', ...files, '--spec', 'experiments/q2/process-spec.json', '--json'], { encoding: 'utf8', maxBuffer: 1 << 28 }));
  const inv = out.rows.filter((r) => !r.valid).length;
  if (inv / out.rows.length > 0.1) stop(`invalid ${inv}/${out.rows.length} in ${a}`);
  rows[a] = out.rows.filter((r) => r.valid);
}
console.log('| arm | n | trials with citations | N+X share (mean over trials with citations) | O share | citations per trial | task passed | B share |\n|---|---|---|---|---|---|---|---|');
const shares = {};
for (const a of ARMS) {
  const r = rows[a], withC = r.filter((x) => (x.locators ?? 0) > 0);
  shares[a] = withC.map((x) => x.nxRate ?? 0);
  const o = withC.map((x) => (x.cites?.O ?? 0) / Math.max(1, Object.values(x.cites ?? {}).reduce((s, v) => s + v, 0)));
  console.log(`| ${a} | ${r.length} | ${withC.length} | ${withC.length ? f2(mean(shares[a])) : '-'} | ${withC.length ? f2(mean(o)) : '-'} | ${f2(mean(r.map((x) => x.locators ?? 0)))} | ${r.filter((x) => x.outcome === 'all-followed' || x.outcome === 'some-followed').length}/${r.length} | ${f2(mean(r.map((x) => x.B?.share ?? 0)))} |`);
}
const comps = ['vanilla', 'v0', 'v1'].map((b) => ({ b, d: mean(shares.default) - mean(shares[b]), ci: boot(shares.default, shares[b]), p: perm(shares.default, shares[b]) }));
const adj = holm(comps.map((c) => c.p));
console.log('\n| default vs | difference (N+X share) | 95% bootstrap | permutation p | Holm p | verdict |\n|---|---|---|---|---|---|');
comps.forEach((c, i) => { const floor = mean(shares.default) < 0.02 && mean(shares[c.b]) < 0.02; console.log(`| ${c.b} | ${f2(c.d)} | [${f2(c.ci[0])}, ${f2(c.ci[1])}] | ${c.p.toFixed(4)} | ${adj[i].toFixed(4)} | ${floor ? 'floor' : adj[i] < 0.05 && c.d < 0 ? 'REDUCES' : 'NOT SHOWN'} |`); });
