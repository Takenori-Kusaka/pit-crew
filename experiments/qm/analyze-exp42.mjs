// EXP-42 analysis, fixed before the run (card: docs/experiments/EXP-20261104-42-qm-process-conformance.md).
// Primary: B share (review-phases, process-spec.json) pooled over the 8 cells, default minus each
// of vanilla / v0 / v1; bootstrap interval (10,000 resamples, fixed seed) at 1 - 0.05/3 (Holm /
// Bonferroni over the 3 comparisons); RAISES when the lower bound > 0. Auxiliary: correct verdicts
// and harm (Fisher two-sided + Holm). Secondary: existence of the E items. Descriptive: missing ids.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { harmOf } from './harm.mjs';
import { correct } from './analyze-exp41.mjs';

export const ARMS = ['vanilla', 'v0', 'v1', 'default'];
const OTHERS = ['vanilla', 'v0', 'v1'];
const stop = (m) => { console.log(`STOP: ${m}`); process.exit(2); };
const lf = (k) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; };
export const fisher = (a, b, c, d) => { const n = a + b + c + d, r1 = a + b, c1 = a + c; const p = (k) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(k) - lf(r1 - k) - lf(c1 - k) - lf(n - r1 - c1 + k)); const p0 = p(a); let s = 0; for (let k = Math.max(0, c1 - (n - r1)); k <= Math.min(r1, c1); k++) if (p(k) <= p0 * (1 + 1e-9)) s += p(k); return Math.min(1, s); };
export const holm = (ps) => { const idx = ps.map((p, i) => [p, i]).sort((x, y) => x[0] - y[0]); const out = new Array(ps.length); let prev = 0; idx.forEach(([p, i], r) => { const adj = Math.min(1, Math.max(prev, p * (ps.length - r))); out[i] = adj; prev = adj; }); return out; };
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);

// Bootstrap interval for mean(x) - mean(y), two-sided at level `alpha` (fixed seed: reproducible).
export function bootDiff(x, y, { n = 10000, alpha = 0.05, seed = 20261105 } = {}) {
  let s = seed; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const ds = [];
  for (let i = 0; i < n; i++) ds.push(mean(x.map(() => pick(x))) - mean(y.map(() => pick(y))));
  ds.sort((a, b) => a - b);
  const lo = ds[Math.floor((alpha / 2) * n)], hi = ds[Math.min(n - 1, Math.floor((1 - alpha / 2) * n))];
  return { diff: mean(x) - mean(y), lo, hi };
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('analyze-exp42.mjs')) {
  // The same preregistered analysis serves EXP-42 (defaults) and EXP-43 (held-out cells), pointed
  // at another suite's registration by --prefix / --cells / --spec / --verdicts / --harm.
  const pos = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const opt = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
  const root = pos[0] ?? 'runs/2026-11-05';
  const trials = Number(pos[1] ?? 10);
  const prefix = opt('prefix', 'exp42');
  const cellsFile = opt('cells', 'runs/2026-11-04/exp41-sieve.json');
  const cellsDoc = JSON.parse(readFileSync(cellsFile, 'utf8'));
  const cells = cellsDoc.sieve?.kept ?? cellsDoc.kept;
  const specPath = opt('spec', 'experiments/qm/process-spec.json');
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  const expected = Object.fromEntries(JSON.parse(readFileSync(opt('verdicts', 'experiments/qm/verdicts.json'), 'utf8')).map((v) => [v.case, v]));
  const harmPath = opt('harm', null);
  const harmFn = harmPath ? (await import(new URL(harmPath, `file://${process.cwd().replace(/\\/g, '/')}/`))).harmOf : harmOf;
  const t = Object.fromEntries(ARMS.map((a) => [a, { B: [], ok: 0, n: 0, harm: 0, inv: 0, cutUnknown: 0, noVerdict: 0, E: { behaviour: 0, depth: 0 }, missing: {}, perCell: {} }]));
  for (const c of cells) for (const a of ARMS) {
    const dir = join(root, `${prefix}-${c}-${a}`), p = join(dir, 'results.json');
    if (!existsSync(p)) stop(`missing ${dir}`);
    const recs = JSON.parse(readFileSync(p, 'utf8')).records;
    if (recs.length !== trials) stop(`${dir}: ${recs.length}/${trials}`);
    const valid = recs.filter((r) => r.validity?.status !== 'invalid');
    t[a].inv += recs.length - valid.length;
    if (recs.length - valid.length > Math.ceil(trials * 0.1)) { console.log(`EXCLUDED (invalid > 10%): ${dir}`); continue; }
    const out = JSON.parse(execFileSync(process.execPath, ['packages/pit-wall/src/graders/process/cli.mjs', p, '--spec', specPath, '--json'], { encoding: 'utf8', maxBuffer: 1 << 28 }));
    const rows = out.rows.filter((r) => r.valid);
    const B = rows.map((r) => r.B?.share ?? 0);
    t[a].B.push(...B);
    for (const r of rows) for (const id of r.B?.missing ?? []) t[a].missing[id] = (t[a].missing[id] ?? 0) + 1;
    const cell = { id: c, spec: spec[c], expect: { verdict: expected[c].verdict, harm: expected[c].harmIfWrong } };
    const ok = valid.filter((r) => correct(r, expected[c].verdict, spec[c])).length;
    const harm = valid.filter((r) => harmFn(r, cell).length > 0).length;
    t[a].ok += ok; t[a].n += valid.length; t[a].harm += harm;
    t[a].noVerdict += rows.filter((r) => (r.B?.missing ?? []).includes('review.verdict-or-routing')).length;
    t[a].perCell[c] = { B: mean(B), ok: `${ok}/${valid.length}`, harm };
    // E items (existence only) via the review grader's E series ids are not in cli rows; count from missing of E
    for (const r of rows) { if (!(r.E?.missing ?? []).includes('review.behaviour-summary') && r.E?.required) t[a].E.behaviour++; if (!(r.E?.missing ?? []).includes('review.depth-stated') && r.E?.required) t[a].E.depth++; }
  }
  console.log('| arm | n | B share (mean) | correct | harm | no verdict | invalid | E behaviour / depth (of n) |\n|---|---|---|---|---|---|---|---|');
  for (const a of ARMS) console.log(`| ${a} | ${t[a].n} | ${mean(t[a].B).toFixed(3)} | ${t[a].ok}/${t[a].n} | ${t[a].harm} | ${t[a].noVerdict} | ${t[a].inv} | ${t[a].E.behaviour} / ${t[a].E.depth} |`);
  console.log('\nPrimary: default - other, B share, bootstrap interval at 1 - 0.05/3 (Holm over 3 comparisons)');
  const verdicts = {};
  for (const o of OTHERS) {
    const r = bootDiff(t.default.B, t[o].B, { alpha: 0.05 / 3 });
    verdicts[o] = r.lo > 0 ? 'RAISES' : 'NOT SHOWN';
    console.log(`  default - ${o}: ${r.diff.toFixed(3)} [${r.lo.toFixed(3)}, ${r.hi.toFixed(3)}] -> ${verdicts[o]}`);
  }
  console.log('\nAuxiliary (harm, Fisher two-sided + Holm; not a claim):');
  const ps = OTHERS.map((o) => fisher(t.default.harm, t.default.n - t.default.harm, t[o].harm, t[o].n - t[o].harm));
  const adj = holm(ps);
  OTHERS.forEach((o, i) => console.log(`  harm default ${t.default.harm}/${t.default.n} vs ${o} ${t[o].harm}/${t[o].n}: p ${ps[i].toFixed(4)} (Holm ${adj[i].toFixed(4)})`));
  console.log('\nMissing B ids per arm (descriptive):');
  for (const a of ARMS) console.log(`  ${a}: ${Object.entries(t[a].missing).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k}=${v}`).join(' ') || '-'}`);
  console.log('\nPer cell (descriptive):');
  for (const c of cells) console.log(`  ${c}: ${ARMS.map((a) => `${a} B ${t[a].perCell[c]?.B?.toFixed(2) ?? '-'} ok ${t[a].perCell[c]?.ok ?? '-'} harm ${t[a].perCell[c]?.harm ?? '-'}`).join(' | ')}`);
  writeFileSync(join(root, `${prefix}-summary.json`), JSON.stringify({ arms: t, verdicts }, null, 2));
}
