// Third-edition reader measure (design 23 §13) on the EXP-32 real prose — DISTRIBUTION ONLY
// (exploratory; not a verdict): per arm, S = P_r − P_x with masked texts, k (leak after masking),
// L2 (reader solving the task from the task statement), and the residue left after masking.
//   rationale  = the agent's prose before the first implementation edit, masked with the planted options
//   control    = the cell's task statement (request + issue body), masked           (same task, no reasons)
//   degenerate = the adopted option's wording, masked                              (shared across arms)
//   P_0        = content-free stub "[案]."                                          (shared across arms)
// Sample: N points per arm with non-empty prose and a known adopted option (fixed seed). Jev reader;
// cost printed; key never printed. Usage (any host with the key): node experiments/judge/e-series-reader-v3.mjs [--n=20] [--k=4]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { eventTable, fileRole } from '../../packages/pit-wall/src/graders/process/events.mjs';
import { authoredTexts } from '../../packages/pit-wall/src/graders/process/authored.mjs';
import { maskOptions, maskedResidue, MASK } from '../../packages/pit-wall/src/graders/process/judge/mask.mjs';
import { apiKey, measurePointJevV3 } from '../../packages/pit-wall/src/graders/process/judge/jev.mjs';
import * as H5 from '../heldout-s5/decision-correct.mjs';
import * as D3 from '../d3/decision-correct.mjs';

if (!apiKey()) { console.error('no key'); process.exit(2); }
const args = process.argv.slice(2);
const N = Number(args.find((a) => a.startsWith('--n='))?.slice(4) ?? 20);
const K = Number(args.find((a) => a.startsWith('--k='))?.slice(4) ?? 4);
const root = 'runs/2026-11-04';
const ARMS = ['vanilla', 'v0', 'v1', 'default'];
const SUITES = { heldout: { mod: H5, cells: ['h5-a1', 'h5-b1', 'h5-c1', 'h5-d1'], suite: 'suites/heldout-s5/suite.yaml' }, d3: { mod: D3, cells: ['d3-3', 'd3-4'], suite: 'suites/d3/suite.yaml' } };

// Task statement per cell from the generated suite (a comment line, then JSON).
const taskText = {};
for (const { suite } of Object.values(SUITES)) {
  const t = readFileSync(suite, 'utf8'); const j = JSON.parse(t.slice(t.indexOf('\n') + 1));
  for (const c of j.cases) { const p = c.params ?? {}; const issue = p.issue ? `${p.issue.title ?? ''}\n${p.issue.body ?? ''}` : ''; taskText[c.id] = `${p.request ?? ''}\n${issue}`.trim(); }
}
function proseBeforeImpl(record) {
  const table = eventTable(record); const authored = authoredTexts(record, table);
  const implIdx = table.events.findIndex((e) => (e.writes ?? []).some((w) => fileRole(w.path) === 'impl'));
  const cut = implIdx < 0 ? Infinity : table.events[implIdx].pos;
  let s = authored.filter((a) => a.prose && (a.pos ?? 0) < cut).map((a) => String(a.text)).join('\n\n---\n\n');
  if (s.length > 6000) s = s.slice(-6000);
  return s;
}
// Pool of (point, record) with prose and a known adopted option.
const pool = [];
for (const [suite, { mod, cells }] of Object.entries(SUITES)) for (const c of cells) for (const a of ARMS) {
  const p = join(root, `exp32-${suite}-${c}-${a}`, 'results.json'); if (!existsSync(p)) continue;
  for (const r of JSON.parse(readFileSync(p, 'utf8')).records) {
    if (r.validity?.status === 'invalid') continue;
    const text = proseBeforeImpl(r); if (!text.trim()) continue;
    const decided = mod.decideAll(r);
    for (const pid of mod.decidablePointIds(c)) {
      const reg = mod.REGISTRY[c][pid]; const d = decided[pid];
      const idx = (reg.options ?? []).findIndex((o) => o.id === d.chosen);
      if (idx < 0 || reg.options.length < 2) continue;
      pool.push({ suite, cell: c, arm: a, trial: r.trial ?? r.harborTrial, pid, options: reg.options.map((o) => ({ text: o.text })), adoptedIndex: idx, correct: d.correct, text });
    }
  }
}
let seed = 20261106; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const sample = [];
for (const a of ARMS) sample.push(...pool.filter((x) => x.arm === a).map((x) => ({ ...x, r: rnd() })).sort((x, y) => x.r - y.r).slice(0, N));
console.log(`pool ${pool.length}; sample ${sample.length} (${N} per arm)`);

const shared = new Map(); // `${cell}|${pid}|${adoptedIndex}` -> { P_0, P_d }
let tokens = 0, errors = 0;
const rows = [];
for (const pt of sample) {
  const masked = maskOptions(pt.text, pt.options);
  const control = maskOptions(taskText[pt.cell] ?? '', pt.options);
  const degenerate = maskOptions(`${pt.options[pt.adoptedIndex].text}.`, pt.options);
  const key = `${pt.cell}|${pt.pid}|${pt.adoptedIndex}`;
  const m = await measurePointJevV3({ options: pt.options, adoptedIndex: pt.adoptedIndex, rationale: masked, controlRationale: control, degenerate, nullText: `${MASK}.` }, { k: K, shared: shared.get(key) ?? null });
  if (!shared.has(key)) shared.set(key, m.shared);
  tokens += m.inputTokens; errors += m.errors;
  const row = { cell: pt.cell, arm: pt.arm, trial: pt.trial, pid: pt.pid, m: pt.options.length, correct: pt.correct, residue: +maskedResidue(masked, pt.text).toFixed(2), maskedChars: masked.length, P_r: m.P_r, P_x: m.P_x, P_0: m.P_0, P_d: m.P_d, S: m.S, L1: m.L1, L2: m.L2, k: m.k };
  rows.push(row);
  console.log(`${pt.cell} ${pt.arm} #${pt.trial} ${pt.pid}: residue ${row.residue} | P_r ${m.P_r?.toFixed(2)} P_x ${m.P_x?.toFixed(2)} P_0 ${m.P_0?.toFixed(2)} P_d ${m.P_d?.toFixed(2)} | S ${m.S?.toFixed(2)} L1 ${m.L1?.toFixed(2)} L2 ${m.L2?.toFixed(2)} k=${m.k}`);
}
const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
const tally = {};
for (const a of ARMS) {
  const rs = rows.filter((r) => r.arm === a), k0 = rs.filter((r) => r.k === 0);
  tally[a] = { n: rs.length, k1: rs.filter((r) => r.k === 1).length, residueMedian: med(rs.map((r) => r.residue)), S_median_all: med(rs.map((r) => r.S)), S_pos_all: rs.filter((r) => r.S > 0).length, S_median_k0: med(k0.map((r) => r.S)), S_pos_k0: `${k0.filter((r) => r.S > 0).length}/${k0.length}`, L2_median: med(rs.map((r) => r.L2)), L2_abs_gt_0_3: rs.filter((r) => Math.abs(r.L2) > 0.3).length };
  console.log(a, JSON.stringify(tally[a]));
}
const summary = { ...tally, jevInputTokens: tokens, errors, costUSD: +(tokens / 1e6 * 0.042).toFixed(4) };
console.log(JSON.stringify({ jevInputTokens: tokens, errors, costUSD: summary.costUSD }));
writeFileSync(`experiments/judge/e-series-reader-v3-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ summary, rows }, null, 2));
