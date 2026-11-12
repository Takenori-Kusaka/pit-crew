// EXP-45 analysis, fixed before the run (card: docs/experiments/EXP-20261112-45-fix-process-conformance.md).
// Primary: B-F share (fix-phases, process-spec.json) pooled over the kept cells, default minus each of
// vanilla / v0; bootstrap interval (10,000 resamples, fixed seed) at 1 - 0.05/2 (Holm / Bonferroni over
// the 2 comparisons); RAISES when the lower bound > 0. Auxiliary (not a claim): correct trials (the
// sieve's three conditions) and harm, Fisher two-sided + Holm. Secondary: existence of the E item.
// Descriptive: missing ids, handling of findings, undecidable counts.
// Usage: node experiments/fix/analyze-exp45.mjs [runs/2026-11-12] [--prefix exp45] [--trials 30] [--cells experiments/fix/sieve.json]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeRecord, optsFor } from '../../packages/pit-wall/src/graders/process/cli.mjs';
import { bootDiff, fisher, holm } from '../qm/analyze-exp42.mjs';
import { harmOf, graderHarm } from './harm.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const optKeys = new Set(args.filter((a) => a.startsWith('--')).map((a) => args.indexOf(a) + 1));
const root = args.find((a, i) => !a.startsWith('--') && !optKeys.has(i)) ?? 'runs/2026-11-12';
const prefix = opt('prefix', 'exp45'), trials = Number(opt('trials', 30));
const ARMS = ['vanilla', 'v0', 'default'], OTHERS = ['vanilla', 'v0'];
const spec = JSON.parse(readFileSync('experiments/fix/process-spec.json', 'utf8'));
const cells = JSON.parse(readFileSync(opt('cells', 'experiments/fix/sieve.json'), 'utf8')).kept;
const WANT = { fix: 'fixed', reject: 'rejected', route: 'routed' };
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const stop = (m) => { console.log(`STOP: ${m}`); process.exit(2); };
const lines = []; const out = (s) => { lines.push(s); console.log(s); };

const t = Object.fromEntries(ARMS.map((a) => [a, { B: [], n: 0, ok: 0, harm: 0, gharm: 0, inv: 0, E: 0, En: 0, undecided: 0, missing: {}, harmIds: {}, handling: { fixed: 0, rejected: 0, routed: 0, mentioned: 0, absent: 0 }, handlingWrong: 0, perCell: {} }]));
for (const c of cells) for (const a of ARMS) {
  const p = join(root, `${prefix}-${c}-${a}`, 'results.json');
  if (!existsSync(p)) stop(`missing ${p}`);
  const recs = JSON.parse(readFileSync(p, 'utf8')).records;
  if (recs.length !== trials) stop(`${p}: ${recs.length}/${trials}`);
  const valid = recs.filter((r) => r.validity?.status !== 'invalid');
  t[a].inv += recs.length - valid.length;
  if (recs.length - valid.length > Math.ceil(trials * 0.1)) { out(`EXCLUDED (invalid > 10%): ${c} ${a}`); continue; }
  const Bc = []; let okc = 0, harmc = 0;
  for (const r of valid) {
    const g = gradeRecord(r, optsFor(c, spec, {})).phases;
    const share = g.B.share ?? 0; t[a].B.push(share); Bc.push(share);
    t[a].undecided += g.checks.filter((x) => x.series === 'B' && x.result === null).length;
    for (const id of g.B.missing) t[a].missing[id] = (t[a].missing[id] ?? 0) + 1;
    if (g.E.required) { t[a].En++; if (g.E.satisfied) t[a].E++; }
    const fs = g.facts.findings ?? [];
    for (const f of fs) t[a].handling[f.status] = (t[a].handling[f.status] ?? 0) + 1;
    const handling = fs.every((f) => f.status === WANT[f.expect]); if (!handling) t[a].handlingWrong++;
    const h = harmOf(r), gh = graderHarm(g);
    for (const id of h) t[a].harmIds[id] = (t[a].harmIds[id] ?? 0) + 1;
    const correct = handling && r.state?.checks?.resolved === 0 && h.length === 0 && gh.length === 0;
    t[a].n++; if (correct) { t[a].ok++; okc++; } if (h.length) { t[a].harm++; harmc++; } if (gh.length) t[a].gharm++;
  }
  t[a].perCell[c] = { B: mean(Bc), ok: `${okc}/${valid.length}`, harm: harmc };
}
out('| arm | n | B-F share (mean) | correct | end-state harm | grader harm | invalid | E table (of n) | undecided checks |\n|---|---|---|---|---|---|---|---|---|');
for (const a of ARMS) out(`| ${a} | ${t[a].n} | ${mean(t[a].B).toFixed(3)} | ${t[a].ok}/${t[a].n} | ${t[a].harm} | ${t[a].gharm} | ${t[a].inv} | ${t[a].E}/${t[a].En} | ${t[a].undecided} |`);
out('\nPrimary: default - other, B-F share, bootstrap interval at 1 - 0.05/2 (Holm over 2 comparisons)');
const verdicts = {};
for (const o of OTHERS) {
  const r = bootDiff(t.default.B, t[o].B, { alpha: 0.05 / 2 });
  verdicts[o] = r.lo > 0 ? 'RAISES' : 'NOT SHOWN';
  out(`  default - ${o}: ${r.diff.toFixed(3)} [${r.lo.toFixed(3)}, ${r.hi.toFixed(3)}] -> ${verdicts[o]}`);
}
out('\nAuxiliary (not a claim): correct and end-state harm, Fisher two-sided + Holm');
const pc = OTHERS.map((o) => fisher(t.default.ok, t.default.n - t.default.ok, t[o].ok, t[o].n - t[o].ok));
const ph = OTHERS.map((o) => fisher(t.default.harm, t.default.n - t.default.harm, t[o].harm, t[o].n - t[o].harm));
const hc = holm(pc), hh = holm(ph);
OTHERS.forEach((o, i) => out(`  vs ${o}: correct ${t.default.ok}/${t.default.n} vs ${t[o].ok}/${t[o].n} p ${pc[i].toFixed(4)} (Holm ${hc[i].toFixed(4)}) | harm ${t.default.harm}/${t.default.n} vs ${t[o].harm}/${t[o].n} p ${ph[i].toFixed(4)} (Holm ${hh[i].toFixed(4)})`));
out('\nDescriptive:');
for (const a of ARMS) out(`  ${a}: missing ${Object.entries(t[a].missing).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([k, v]) => `${k.replace('fix.', '')} ${v}`).join(', ')} | handling ${JSON.stringify(t[a].handling)} wrong-trials ${t[a].handlingWrong} | harm ids ${JSON.stringify(t[a].harmIds)}`);
out('\nPer cell (descriptive; no per-cell claim): ' + cells.map((c) => `${c} ${ARMS.map((a) => `${a} ${t[a].perCell[c] ? `${t[a].perCell[c].B.toFixed(2)}/${t[a].perCell[c].ok}` : 'excluded'}`).join(' ')}`).join(' ; '));
writeFileSync(join(root, `${prefix}-analysis.txt`), `${lines.join('\n')}\n`);
writeFileSync(join(root, `${prefix}-analysis.json`), JSON.stringify({ verdicts, arms: Object.fromEntries(ARMS.map((a) => [a, { n: t[a].n, B: mean(t[a].B), correct: t[a].ok, harm: t[a].harm, missing: t[a].missing, perCell: t[a].perCell }])) }, null, 1));
