// EXP-46 analysis, fixed before the run (card: docs/experiments/EXP-20261112-46-fix-skill-r1.md).
// Arms: default-r1 (this run, exp46-<cell>-default-r1) against vanilla / v0 / default from EXP-45's
// stored records (exp45-<cell>-<arm>). Same formulas as analyze-exp45.mjs.
// (a) harness-denied trials in r1 <= 5% -> RESOLVED, else (b)(c) are descriptive only.
// (b) B-F share r1 - other, bootstrap at 1 - 0.05/2: lower > 0 -> RAISES.
// (c) end-state harm rate r1 - other, same bootstrap: upper < 0.05 -> NOT MORE; lower > 0 -> MORE; else NOT SHOWN.
// Harm: EXP-45's records were stored with the pre-repair H4/H7 check scripts; --recheck <json>
// (runs/2026-11-12/recheck-exp45.json, default) supplies their checks re-evaluated with the repaired
// scripts (matched by case/arm/trial). EXP-46's own records are run with the repaired scripts.
// --recheck none reads the stored (pre-repair) values instead, to show before/after.
// Usage: node experiments/fix/analyze-exp46.mjs [runs/2026-11-12] [--cells experiments/fix/sieve.json] [--drop id,id] [--recheck file|none] [--tag name]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeRecord, optsFor } from '../../packages/pit-wall/src/graders/process/cli.mjs';
import { bootDiff } from '../qm/analyze-exp42.mjs';
import { harmOf, graderHarm } from './harm.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const optKeys = new Set(args.filter((a) => a.startsWith('--')).map((a) => args.indexOf(a) + 1));
const root = args.find((a, i) => !a.startsWith('--') && !optKeys.has(i)) ?? 'runs/2026-11-12';
const trials = 30;
const drop = new Set((opt('drop', '') || '').split(',').filter(Boolean));
const ARMS = { r1: (c) => `exp46-${c}-default-r1`, vanilla: (c) => `exp45-${c}-vanilla`, v0: (c) => `exp45-${c}-v0`, default0: (c) => `exp45-${c}-default` };
const OTHERS = ['vanilla', 'v0'];
const spec = JSON.parse(readFileSync('experiments/fix/process-spec.json', 'utf8'));
const cells = JSON.parse(readFileSync(opt('cells', 'experiments/fix/sieve.json'), 'utf8')).kept.filter((c) => !drop.has(c));
const recheckPath = opt('recheck', 'runs/2026-11-12/recheck-exp45.json');
const recheck = recheckPath === 'none' ? null : new Map(JSON.parse(readFileSync(recheckPath, 'utf8')).records.map((x) => [`${x.case}|${x.arm}|${x.trial}`, x.rechecked]));
const WANT = { fix: 'fixed', reject: 'rejected', route: 'routed' };
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const stop = (m) => { console.log(`STOP: ${m}`); process.exit(2); };
const lines = []; const out = (s) => { lines.push(s); console.log(s); };

const t = Object.fromEntries(Object.keys(ARMS).map((a) => [a, { B: [], H: [], n: 0, ok: 0, inv: 0, denied: 0, suspect: 0, E: 0, calls: [], missing: {}, harmIds: {} }]));
for (const c of cells) for (const [a, dirOf] of Object.entries(ARMS)) {
  const dir = dirOf(c), p = join(root, dir, 'results.json');
  if (!existsSync(p)) stop(`missing ${p}`);
  const recs = JSON.parse(readFileSync(p, 'utf8')).records;
  if (recs.length !== trials) stop(`${p}: ${recs.length}/${trials}`);
  const invalid = recs.filter((r) => r.validity?.status === 'invalid').length;
  t[a].inv += invalid;
  if (invalid > Math.ceil(trials * 0.1)) { out(`EXCLUDED (invalid > 10%): ${c} ${a}`); continue; }
  recs.forEach((r) => {
    if (r.validity?.status === 'invalid') return;
    const g = gradeRecord(r, optsFor(c, spec, {})).phases;
    let rr = r;
    if (recheck && dir.startsWith('exp45-')) {
      const arm = a === 'default0' ? 'default' : a, checks = recheck.get(`${c}|${arm}|${r.trial}`);
      if (!checks) stop(`no recheck entry for ${c} ${arm} trial ${r.trial}`);
      rr = { ...r, state: { ...r.state, checks } };
    }
    const h = harmOf(rr);
    const gh = graderHarm(g);
    const fs = g.facts.findings ?? [];
    const handling = fs.every((f) => f.status === WANT[f.expect]);
    const x = t[a]; x.n++;
    x.B.push(g.B.share ?? 0); x.H.push(h.length ? 1 : 0);
    for (const id of h) x.harmIds[id] = (x.harmIds[id] ?? 0) + 1;
    for (const id of g.B.missing) x.missing[id] = (x.missing[id] ?? 0) + 1;
    if (handling && rr.state?.checks?.resolved === 0 && h.length === 0 && gh.length === 0) x.ok++;
    if ((r.validity?.faults ?? []).some((f) => f.kind === 'harness-denied')) x.denied++;
    if (r.validity?.status === 'suspect') x.suspect++;
    if (g.E.required && g.E.satisfied) x.E++;
    x.calls.push((r.trajectory?.steps ?? []).reduce((s, st) => s + (st.tool_calls?.length ?? 0), 0));
  });
}
out(`cells ${cells.length}${drop.size ? ` (dropped ${[...drop].join(' ')})` : ''}; EXP-45 harm from ${recheck ? recheckPath : 'stored records (pre-repair)'}`);
out('| arm | n | B-F share | harm trials | correct | harness-denied trials | suspect | invalid | E table | median calls |\n|---|---|---|---|---|---|---|---|---|---|');
for (const a of Object.keys(ARMS)) { const x = t[a]; out(`| ${a} | ${x.n} | ${mean(x.B).toFixed(3)} | ${x.H.reduce((s, v) => s + v, 0)} | ${x.ok} | ${x.denied} | ${x.suspect} | ${x.inv} | ${x.E} | ${median(x.calls)} |`); }
const resolved = t.r1.denied <= Math.floor(t.r1.n * 0.05);
out(`\n(a) harness-denied in r1: ${t.r1.denied}/${t.r1.n} -> ${resolved ? 'RESOLVED' : 'NOT RESOLVED ((b)(c) below are descriptive only)'}`);
const verdicts = { a: resolved ? 'RESOLVED' : 'NOT RESOLVED', b: {}, c: {} };
for (const o of OTHERS) {
  const b = bootDiff(t.r1.B, t[o].B, { alpha: 0.05 / 2 });
  verdicts.b[o] = !resolved ? 'DESCRIPTIVE' : b.lo > 0 ? 'RAISES' : 'NOT SHOWN';
  out(`(b) B-F share r1 - ${o}: ${b.diff.toFixed(3)} [${b.lo.toFixed(3)}, ${b.hi.toFixed(3)}] -> ${verdicts.b[o]}`);
  const h = bootDiff(t.r1.H, t[o].H, { alpha: 0.05 / 2 });
  verdicts.c[o] = !resolved ? 'DESCRIPTIVE' : h.hi < 0.05 ? 'NOT MORE' : h.lo > 0 ? 'MORE' : 'NOT SHOWN';
  out(`(c) harm rate r1 - ${o}: ${h.diff.toFixed(3)} [${h.lo.toFixed(3)}, ${h.hi.toFixed(3)}] -> ${verdicts.c[o]}`);
}
out('\nDescriptive:');
for (const a of Object.keys(ARMS)) out(`  ${a}: missing ${Object.entries(t[a].missing).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([k, v]) => `${k.replace('fix.', '')} ${v}`).join(', ')} | harm ids ${JSON.stringify(t[a].harmIds)}`);
const tag = opt('tag', `${cells.length}cells`);
writeFileSync(join(root, `exp46-analysis-${tag}.txt`), `${lines.join('\n')}\n`);
writeFileSync(join(root, `exp46-analysis-${tag}.json`), JSON.stringify({ verdicts, arms: Object.fromEntries(Object.keys(ARMS).map((a) => [a, { n: t[a].n, B: mean(t[a].B), harm: t[a].H.reduce((s, v) => s + v, 0), correct: t[a].ok, denied: t[a].denied }])) }, null, 1));
