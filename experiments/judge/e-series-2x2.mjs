// E series, second edition (design 23 §3.3): per planted decision point of the EXP-32 runs
// (heldout-s5 and d3 cells, 4 arms), the four quantities without human labels:
//   correct      — the chosen option is the planted correct one (decision-correct.mjs, final state)
//   mentioned    — the extracted structure names the planted alternative(s) / claims triviality
//   coherent     — SEURAT / grounded / Pareto over the extracted structure (judge/structure.mjs)
//   communicable — reader-model Δ: an 8B reader picks the option the agent actually chose from the
//                  rationale alone, minus the no-rationale control (judge/reader.mjs)
// Read as a 2x2 (coherent x correct) per arm. The extraction is cached by text hash so the GPU
// work is done once. Nothing here is a verdict about arms (exploratory: the EXP-32 runs predate the
// measures); it is the first machine-only E reading, to be preregistered on new runs afterwards.
//
// Usage: node experiments/judge/e-series-2x2.mjs [runs/2026-11-04] [--no-model] [--reader] [--out=f]
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { eventTable, fileRole } from '../../packages/pit-wall/src/graders/process/events.mjs';
import { authoredTexts } from '../../packages/pit-wall/src/graders/process/authored.mjs';
import { extractTargetedBatch, splitArgs } from '../../packages/pit-wall/src/graders/process/judge/extract.mjs';
import { coherence } from '../../packages/pit-wall/src/graders/process/judge/structure.mjs';
import { measurePoint } from '../../packages/pit-wall/src/graders/process/judge/reader.mjs';
import { apiKey, jevSkeleton, measurePointJev } from '../../packages/pit-wall/src/graders/process/judge/jev.mjs';
let jevTokens = 0;
import * as H5 from '../heldout-s5/decision-correct.mjs';
import * as D3 from '../d3/decision-correct.mjs';

const args = process.argv.slice(2);
const root = args.find((a) => !a.startsWith('--')) ?? 'runs/2026-11-04';
const noModel = args.includes('--no-model');
// --reader[=N]: run the reader on at most N decision points per arm (12 calls each; the full set
// would be thousands of calls). Points are taken in file order after a fixed-seed shuffle.
const readerArg = args.find((a) => a.startsWith('--reader'));
const withReader = !!readerArg;
const readerPerArm = Number(readerArg?.split('=')[1] ?? 20);
const readerDone = {};
let rseed = 20261105; const rrnd = () => ((rseed = (rseed * 1103515245 + 12345) % 2147483648) / 2147483648);
const out = args.find((a) => a.startsWith('--out='))?.slice(6) ?? `experiments/judge/e-series-2x2-${new Date().toISOString().slice(0, 10)}.json`;
const CACHE = 'experiments/judge/e-cache-extract.json';
// 2026-11-05 20:19: the memory reaper killed the run mid-write and left a 0-byte cache (~400 GPU
// extractions lost). Write atomically (tmp + rename) and tolerate an unreadable file.
let cache = {};
try { if (existsSync(CACHE)) cache = JSON.parse(readFileSync(CACHE, 'utf8')); } catch (e) { console.error(`cache unreadable (${e.message}); starting empty`); }
const saveCache = () => { writeFileSync(`${CACHE}.tmp`, JSON.stringify(cache)); renameSync(`${CACHE}.tmp`, CACHE); };
// 2026-11-05: granite paraphrases real prose (quote check fails 195/228) → second lineage llama3.1;
// extraction is TARGETED (per planted option: mentioned / claimed_adopted / verbatim reasons), since
// free extraction never agreed on *what the decision is* on real prose (design 23 §11).
// 2026-11-05 22:3x (owner): llama3.1 marks absent options as mentioned on real prose (valid 86/577) →
// the second skeleton lineage is Jev (Noul, threshold 0.7); reasons and evidence come from qwen3.
const MODELS = (args.find((a) => a.startsWith('--models='))?.slice(9) ?? 'qwen3:8b,jev').split(',');
const CALLERS = { jev: (text, options) => jevSkeleton(text, options).then((r) => { jevTokens += r.inputTokens; return r; }) };
const ARMS = ['vanilla', 'v0', 'v1', 'default'];
const SUITES = { heldout: { mod: H5, cells: ['h5-a1', 'h5-b1', 'h5-c1', 'h5-d1'] }, d3: { mod: D3, cells: ['d3-3', 'd3-4'] } };

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
// Content-word overlap between an extracted option and a planted option description.
const words = (s) => new Set(String(s ?? '').toLowerCase().split(/[^\p{L}\p{N}_]+/u).filter((w) => w.length >= 3));
export function matchOption(extractedText, plantedText) {
  const a = words(extractedText), b = words(plantedText);
  if (!a.size || !b.size) return 0;
  const inter = [...a].filter((w) => b.has(w)).length;
  return inter / Math.min(a.size, b.size);
}

// The agent's prose before the first implementation edit (the decision is written there).
function proseBeforeImpl(record) {
  const table = eventTable(record);
  const authored = authoredTexts(record, table);
  const implIdx = table.events.findIndex((e) => (e.writes ?? []).some((w) => fileRole(w.path) === 'impl'));
  const cut = implIdx < 0 ? Infinity : table.events[implIdx].pos;
  let s = authored.filter((a) => a.prose && (a.pos ?? 0) < cut).map((a) => String(a.text)).join('\n\n---\n\n');
  if (s.length > 14000) s = s.slice(-14000);
  return s;
}

// Targeted extraction -> structure.mjs input: only the options the prose mentions take part in the
// argument structure; "adopted" here is what the TEXT claims (the final state L0 is a separate column).
const toStructure = (ex, planted) => ({ decision: '', options: ex.options.filter((o) => o.mentioned).map((o) => ({ id: o.id, text: planted.find((p) => p.id === o.id)?.text ?? o.id, adopted: !!o.claimed_adopted, pros: splitArgs(o.pros), cons: splitArgs(o.cons) })), trivial: ex.trivial_claim ? { claimed: true } : undefined });

// Pass 1: collect (record, decision point) pairs with their prose and planted options.
// Pass 2: extract model-major (one load per model), keyed by text + planted options.
const items = [];
for (const [suite, { mod, cells }] of Object.entries(SUITES)) for (const c of cells) for (const a of ARMS) {
  const p = join(root, `exp32-${suite}-${c}-${a}`, 'results.json');
  if (!existsSync(p)) { console.log(`missing ${p}`); continue; }
  for (const r of JSON.parse(readFileSync(p, 'utf8')).records) {
    if (r.validity?.status === 'invalid') continue;
    const text = proseBeforeImpl(r), decided = mod.decideAll(r);
    for (const pid of mod.decidablePointIds(c)) { const planted = mod.REGISTRY[c][pid].options ?? []; items.push({ suite, c, a, r, pid, d: decided[pid], planted, text, options: planted.map((o) => ({ id: o.id, text: o.text })) }); }
  }
}
const batch = noModel ? null : await extractTargetedBatch(MODELS, items.filter((x) => x.options.length), { cache, hash: sha, callers: CALLERS, onProgress: (m, i, n) => { if (i % 10 === 0 || i === n) { console.log(`${m}: ${i}/${n}`); saveCache(); } } });
if (!noModel) saveCache();
const rows = [];
for (const { suite, c, a, r, pid, d, planted, text } of items) {
  {
    let ex = null, exStatus = 'skipped', exReason = null;
    // Only a settled extraction (two lineages agree on the skeleton) is used; an abstention carries
    // no structure (the first run, 2026-11-05 18:15, mistakenly used the single valid output).
    if (batch && text.trim() && planted.length) { const s = batch.get({ text, options: planted.map((o) => ({ id: o.id, text: o.text })) }); exStatus = s?.status ?? 'abstain'; ex = exStatus === 'ok' ? s.out : null; if (s?.reason) exReason = s.reason; }
    const coh = ex ? coherence(toStructure(ex, planted)) : null;
    {
      // mentioned: every planted alternative (not the chosen one) is mentioned in the prose
      const mentioned = ex ? planted.filter((o) => o.id !== d.chosen).every((o) => ex.options.find((x) => x.id === o.id)?.mentioned === true) : null;
      const trivialClaimed = ex ? !!ex.trivial_claim : null;
      // claimed: the option the TEXT says it adopts; claimMatchesFinal: that claim agrees with L0
      const claimed = ex ? (ex.options.find((o) => o.claimed_adopted)?.id ?? null) : null;
      const claimMatchesFinal = ex && d.chosen !== 'unknown' ? claimed === d.chosen : null;
      const row = { suite, cell: c, arm: a, trial: r.trial ?? r.harborTrial, point: pid, chosen: d.chosen, correct: d.correct, extraction: exStatus, abstainReason: exReason, options: ex ? ex.options.filter((o) => o.mentioned).length : null, mentioned, claimed, claimMatchesFinal, trivialClaimed, coherent: coh?.coherent ?? null, findings: coh?.findings?.map((f) => f.code) ?? null, grounded: coh?.grounded ?? null };
      if (withReader && ex && d.chosen !== 'unknown' && planted.length >= 2 && (readerDone[a] ?? 0) < readerPerArm && rrnd() < 0.5) {
        const adoptedIndex = planted.findIndex((o) => o.id === d.chosen);
        if (adoptedIndex >= 0) {
          readerDone[a] = (readerDone[a] ?? 0) + 1;
          const degenerate = `${planted[adoptedIndex].text}.`;
          const pt = { options: planted.map((o) => ({ text: o.text })), adoptedIndex, rationale: text.slice(-6000), degenerate };
          // Owner 2026-11-05: Jev is the primary reader (probabilities, no ties, no GPU); the local 8B
          // is the sign cross-check. Without a key, the local reader is the only one.
          // 22:24 run: the degenerate baseline (the conclusion in one line) beat the control at every point,
          // so Δ vs control is not the communicable measure; keep the three rates and Δ vs degenerate too.
          if (apiKey()) { const m = await measurePointJev(pt, { k: 4 }); row.communicable = m.delta; row.readerAboveChance = m.aboveChance; row.degenerateBeatsControl = m.degenerateBeatsControl; row.reader = 'jev'; jevTokens += m.inputTokens; row.rates = { with: m.withRationale.rate, control: m.control.rate, degenerate: m.degenerate?.rate ?? null }; row.deltaVsDegenerate = m.withRationale.rate == null || m.degenerate?.rate == null ? null : m.withRationale.rate - m.degenerate.rate; }
          const l = await measurePoint(MODELS[0], pt, { k: 4 });
          if (row.reader === 'jev') { row.localDelta = l.delta; row.signAgree = l.delta == null || row.communicable == null ? null : l.delta === 0 ? 'tie' : Math.sign(l.delta) === Math.sign(row.communicable); }
          else { row.communicable = l.delta; row.readerAboveChance = l.aboveChance; row.degenerateBeatsControl = l.degenerateBeatsControl; row.reader = 'local'; }
        }
      }
      rows.push(row);
    }
  }
}
// 2x2 per arm over points with both quantities.
const tally = {};
for (const r of rows) {
  const t = (tally[r.arm] ??= { points: 0, correct: 0, incorrect: 0, undecided: 0, extracted: 0, abstain: 0, mentioned: 0, trivial: 0, cc: 0, ci: 0, ic: 0, ii: 0, deltaSum: 0, deltaN: 0 });
  t.points++;
  if (r.correct === true) t.correct++; else if (r.correct === false) t.incorrect++; else t.undecided++;
  if (r.extraction === 'ok') t.extracted++; else if (r.extraction === 'abstain') { t.abstain++; t.reasons ??= {}; t.reasons[r.abstainReason ?? '?'] = (t.reasons[r.abstainReason ?? '?'] ?? 0) + 1; }
  if (r.mentioned) t.mentioned++; if (r.trivialClaimed) t.trivial++;
  if (r.claimMatchesFinal === true) t.claimOk = (t.claimOk ?? 0) + 1; else if (r.claimMatchesFinal === false) t.claimNe = (t.claimNe ?? 0) + 1;
  if (r.coherent != null && r.correct != null) { const k = `${r.coherent ? 'c' : 'i'}${r.correct ? 'c' : 'i'}`; t[k]++; }
  if (typeof r.communicable === 'number') { t.deltaSum += r.communicable; t.deltaN++; }
  if (typeof r.deltaVsDegenerate === 'number') { t.dvdSum = (t.dvdSum ?? 0) + r.deltaVsDegenerate; t.dvdN = (t.dvdN ?? 0) + 1; if (r.deltaVsDegenerate > 0) t.dvdPos = (t.dvdPos ?? 0) + 1; }
  if (r.signAgree === true) t.signAgree = (t.signAgree ?? 0) + 1; else if (r.signAgree === false) t.signDisagree = (t.signDisagree ?? 0) + 1; else if (r.signAgree === 'tie') t.signTie = (t.signTie ?? 0) + 1;
}
console.log('| arm | points | correct | incorrect | undecided | extracted / abstain | mentioned | claim=final / ≠ | trivial | coherent∧correct | coherent∧wrong | incoherent∧correct | incoherent∧wrong | mean Δ |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const a of ARMS) { const t = tally[a]; if (!t) continue; console.log(`| ${a} | ${t.points} | ${t.correct} | ${t.incorrect} | ${t.undecided} | ${t.extracted} / ${t.abstain} | ${t.mentioned} | ${t.claimOk ?? 0} / ${t.claimNe ?? 0} | ${t.trivial} | ${t.cc} | ${t.ci} | ${t.ic} | ${t.ii} | ${t.deltaN ? (t.deltaSum / t.deltaN).toFixed(2) : '-'} |`); }
if (withReader) { for (const a of ARMS) { const t = tally[a]; if (t?.deltaN) console.log(`${a}: reader Δ over ${t.deltaN} points; Δ vs degenerate mean ${t.dvdN ? (t.dvdSum / t.dvdN).toFixed(2) : '-'} (>0: ${t.dvdPos ?? 0}/${t.dvdN ?? 0}); local sign agree ${t.signAgree ?? 0} / disagree ${t.signDisagree ?? 0} / tie ${t.signTie ?? 0}`); } console.log(`jev input tokens ${jevTokens} (~$${(jevTokens / 1e6 * 0.042).toFixed(4)})`); }
writeFileSync(out, JSON.stringify({ tally, rows, jevTokens }, null, 2));
console.log(`-> ${out}`);
