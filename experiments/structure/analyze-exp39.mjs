// EXP-39 analysis, fixed before the run (card: docs/experiments/EXP-20261104-39-design-rule-delivery.md).
// E1 per trial: a comparison block with >= 2 options OR an explicit "自明:" declaration, written
// before the first implementation edit. v6 vs default on the 3 main cells (Fisher two-sided);
// guards: js-1b too-heavy (v6 <= default + 1) and B-share non-inferiority (lower bound > -0.05).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eventTable, fileRole } from '../../packages/pit-wall/src/graders/process/events.mjs';
import { authoredTexts } from '../../packages/pit-wall/src/graders/process/authored.mjs';
import { extractOptions } from '../../packages/pit-wall/src/graders/process/judge/score-runs.mjs';
import { errorOf } from '../jobsel/judge.mjs';

const root = process.argv[2] ?? 'runs/2026-11-04';
const MAIN = { 't5-stale-base-weak': 'experiments/process/spec-dev-cells.json', 'h5-a1': 'experiments/heldout-s5/process-spec.json', 'd3-3': 'experiments/d3/process-spec.json' };
const ARMS = ['default', 'v6'];
const stop = (m) => { console.log(`STOP: ${m}`); process.exit(2); };
const lf = (k) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; };
const fisher = (a, b, c, d) => { const n = a + b + c + d, r1 = a + b, c1 = a + c; const p = (k) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(k) - lf(r1 - k) - lf(c1 - k) - lf(n - r1 - c1 + k)); const p0 = p(a); let s = 0; for (let k = Math.max(0, c1 - (n - r1)); k <= Math.min(r1, c1); k++) if (p(k) <= p0 * (1 + 1e-9)) s += p(k); return Math.min(1, s); };
let seed = 20261104; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

// E1 from the record: authored texts positioned before the first implementation edit.
export function e1(record) {
  const table = eventTable(record);
  const authored = authoredTexts(record, table);
  // The first write to an implementation file (not notes, docs or tests) is the cut; texts written
  // at or before that position count (a notes file written in the same call as nothing else counts).
  // Post-hoc fix (2026-11-04, after EXP-39/40 were judged): the first write in every M-skill trial was
  // .gitignore (the state-file rule), which fileRole does not class as notes/docs/test, so the cut sat
  // at the first action and every later note was excluded. The implementation edit is now a write to
  // an 'impl' file. The preregistered verdicts were computed with the old cut and stand as recorded.
  const implIdx = table.events.findIndex((e) => (e.writes ?? []).some((w) => fileRole(w.path) === 'impl'));
  const cut = implIdx < 0 ? Infinity : table.events[implIdx].pos;
  const before = authored.filter((a) => (a.pos ?? 0) < cut);
  const paragraphs = before.flatMap((a) => String(a.text).split(/\n\s*\n/).map((text) => ({ text })));
  const options = extractOptions(paragraphs);
  const obvious = before.some((a) => /自明[:：]/.test(String(a.text)));
  return { options: options.length, compared: options.length >= 2, obvious, e1: options.length >= 2 || obvious };
}

if (process.argv[1]?.endsWith('analyze-exp39.mjs')) {
  const t = {};
  for (const a of ARMS) {
    t[a] = { e1: 0, cmp: 0, obv: 0, n: 0, inv: 0, B: [], per: {} };
    for (const [c, spec] of Object.entries(MAIN)) {
      const p = join(root, `exp39-${c}-${a}`, 'results.json');
      if (!existsSync(p)) stop(`missing exp39-${c}-${a}`);
      const recs = JSON.parse(readFileSync(p, 'utf8')).records;
      if (recs.length !== 10) stop(`exp39-${c}-${a}: ${recs.length}/10`);
      const out = JSON.parse(execFileSync(process.execPath, ['packages/pit-wall/src/graders/process/cli.mjs', p, '--spec', spec, '--json'], { encoding: 'utf8', maxBuffer: 1 << 28 }));
      for (const r of out.rows.filter((r) => r.valid)) t[a].B.push(r.B?.share ?? 0);
      let k = 0, n = 0;
      for (const r of recs) {
        if (r.validity?.status === 'invalid') { t[a].inv++; continue; }
        const x = e1(r); n++; t[a].n++;
        if (x.e1) { k++; t[a].e1++; }
        if (x.compared) t[a].cmp++;
        if (x.obvious && !x.compared) t[a].obv++;
      }
      t[a].per[c] = `${k}/${n}`;
    }
    const cp = join(root, `exp39-js-1b-${a}`, 'results.json');
    if (!existsSync(cp)) stop(`missing exp39-js-1b-${a}`);
    const crecs = JSON.parse(readFileSync(cp, 'utf8')).records;
    if (crecs.length !== 10) stop(`exp39-js-1b-${a}: ${crecs.length}/10`);
    t[a].heavy = crecs.filter((r) => r.validity?.status !== 'invalid' && errorOf(r) === 'too-heavy').length;
    if (t[a].inv > 3) stop(`invalid ${t[a].inv} in ${a}`);
  }
  console.log('| arm | E1 explicit decision | per cell | compared (>=2 options) | obvious-only | js-1b too-heavy | B share | invalid |\n|---|---|---|---|---|---|---|---|');
  for (const a of ARMS) console.log(`| ${a} | ${t[a].e1}/${t[a].n} | ${Object.entries(t[a].per).map(([c, v]) => `${c} ${v}`).join(', ')} | ${t[a].cmp} | ${t[a].obv} | ${t[a].heavy}/10 | ${mean(t[a].B).toFixed(3)} | ${t[a].inv} |`);
  const p = fisher(t.v6.e1, t.v6.n - t.v6.e1, t.default.e1, t.default.n - t.default.e1);
  const d = t.v6.B, b = t.default.B; const ds = [];
  for (let i = 0; i < 10000; i++) ds.push(mean(d.map(() => d[Math.floor(rnd() * d.length)])) - mean(b.map(() => b[Math.floor(rnd() * b.length)])));
  ds.sort((x, y) => x - y);
  const guardHeavy = t.v6.heavy <= t.default.heavy + 1, guardB = ds[250] > -0.05;
  const raises = p < 0.05 && t.v6.e1 / t.v6.n > t.default.e1 / t.default.n;
  console.log(`\nE1 v6 vs default: Fisher p ${p.toFixed(4)} -> ${raises ? 'RAISES' : 'NOT SHOWN'}; guards: too-heavy ${guardHeavy ? 'ok' : 'VIOLATED'} (${t.v6.heavy} vs ${t.default.heavy}), B non-inferiority ${guardB ? 'ok' : 'VIOLATED'} (lower ${ds[250].toFixed(3)})`);
  console.log(raises && guardHeavy && guardB ? 'ADOPT CONDITION MET' : 'adopt condition not met');
}
