// Trial comparison of two readers for communicable Δ (research-machine-only §2.1 #3): the local
// 8B (qwen3:8b via ollama) and TypeSafe Jev (decision-only API, Choice). Same decision points, same
// shuffled labels, same hidden-adoption rationale; reports per reader the pick rate of the option
// the agent actually chose (L0), the no-rationale control, Δ, and the agreement between readers.
// Owner 2026-11-05: try Jev a little to compare; "not needed" is an acceptable conclusion.
// Usage (WSL, ollama up, key in ~/.config/pit-wall/typesafe-api-key): node experiments/judge/compare-readers.mjs [--n=30] [--k=4]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { eventTable, fileRole } from '../../packages/pit-wall/src/graders/process/events.mjs';
import { authoredTexts } from '../../packages/pit-wall/src/graders/process/authored.mjs';
import { buildReaderPrompt, parseChoice, pickRate, communicable, ollamaRead } from '../../packages/pit-wall/src/graders/process/judge/reader.mjs';
import { systemOne, readerQuestion, pickFromAnswer, apiKey } from '../../packages/pit-wall/src/graders/process/judge/jev.mjs';
import * as H5 from '../heldout-s5/decision-correct.mjs';
import * as D3 from '../d3/decision-correct.mjs';

const args = process.argv.slice(2);
const N = Number(args.find((a) => a.startsWith('--n='))?.slice(4) ?? 30);
const K = Number(args.find((a) => a.startsWith('--k='))?.slice(4) ?? 4);
const root = 'runs/2026-11-04';
const LOCAL = 'qwen3:8b';
if (!apiKey()) { console.error('no TypeSafe key: skipping Jev (local reader only)'); }

function prose(record) {
  const table = eventTable(record); const authored = authoredTexts(record, table);
  const implIdx = table.events.findIndex((e) => (e.writes ?? []).some((w) => fileRole(w.path) === 'impl'));
  const cut = implIdx < 0 ? Infinity : table.events[implIdx].pos;
  let s = authored.filter((a) => a.prose && (a.pos ?? 0) < cut).map((a) => String(a.text)).join('\n\n---\n\n');
  return s.length > 6000 ? s.slice(-6000) : s;
}
// Decision points with a known chosen option and >= 2 planted options.
const points = [];
for (const [suite, mod, cells] of [['heldout', H5, ['h5-a1', 'h5-b1', 'h5-c1', 'h5-d1']], ['d3', D3, ['d3-3', 'd3-4']]]) for (const c of cells) for (const a of ['vanilla', 'v0', 'v1', 'default']) {
  const p = join(root, `exp32-${suite}-${c}-${a}`, 'results.json'); if (!existsSync(p)) continue;
  for (const r of JSON.parse(readFileSync(p, 'utf8')).records) {
    if (r.validity?.status === 'invalid') continue;
    const text = prose(r); if (!text.trim()) continue;
    const decided = mod.decideAll(r);
    for (const pid of mod.decidablePointIds(c)) {
      const reg = mod.REGISTRY[c][pid], d = decided[pid];
      const idx = (reg.options ?? []).findIndex((o) => o.id === d.chosen);
      if (idx >= 0 && reg.options.length >= 2) points.push({ cell: c, arm: a, trial: r.trial ?? r.harborTrial, pid, options: reg.options.map((o) => ({ text: o.text })), adoptedIndex: idx, text });
    }
  }
}
let seed = 20261105; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const sample = points.map((x) => ({ ...x, k: rnd() })).sort((x, y) => x.k - y.k).slice(0, N);
console.log(`points ${points.length}, sample ${sample.length}, k ${K}`);

let jevTokens = 0;
async function readLocal(pt, rationale) { const picks = []; for (let i = 0; i < K; i++) { const { prompt, labelOf } = buildReaderPrompt(pt.options, pt.adoptedIndex, rationale, 7 + i); const r = await ollamaRead(LOCAL, prompt).catch(() => ({ out: null })); picks.push(parseChoice(r.out, labelOf)); } return pickRate(picks, pt.adoptedIndex); }
// Jev returns a probability per choice (decision-only, no sampling), so one call per label shuffle
// gives the pick probability of the adopted option directly; the K shuffles only average out label bias.
let jevErrors = 0;
async function readJev(pt, rationale) {
  const probs = [];
  for (let i = 0; i < K; i++) {
    const { state, questions, labelOf, adoptedLabel } = readerQuestion(pt.options, pt.adoptedIndex, rationale, 7 + i);
    const r = await systemOne(state, questions).catch((e) => { jevErrors++; return { error: String(e.message ?? e) }; });
    jevTokens += r.usage?.input_tokens ?? 0;
    const p = r.answers?.pick?.probabilities?.[adoptedLabel];
    if (typeof p === 'number') probs.push(p); else if (r.answers) probs.push(pickFromAnswer(r.answers, labelOf) === pt.adoptedIndex ? 1 : 0);
  }
  return { rate: probs.length ? probs.reduce((s, x) => s + x, 0) / probs.length : null, n: probs.length, invalid: K - probs.length };
}

const rows = [];
for (const pt of sample) {
  const row = { cell: pt.cell, arm: pt.arm, trial: pt.trial, pid: pt.pid, nOptions: pt.options.length };
  const lw = await readLocal(pt, pt.text), lc = await readLocal(pt, null);
  row.local = { ...communicable({ withRationale: lw, control: lc }, pt.options.length), with: lw.rate, control: lc.rate };
  if (apiKey()) { const jw = await readJev(pt, pt.text), jc = await readJev(pt, null); row.jev = { ...communicable({ withRationale: jw, control: jc }, pt.options.length), with: jw.rate, control: jc.rate }; }
  rows.push(row);
  console.log(`${pt.cell} ${pt.arm} #${pt.trial} ${pt.pid}: local Δ ${row.local.delta?.toFixed(2)} (with ${row.local.with?.toFixed(2)} ctl ${row.local.control?.toFixed(2)})${row.jev ? ` | jev Δ ${row.jev.delta?.toFixed(2)} (with ${row.jev.with?.toFixed(2)} ctl ${row.jev.control?.toFixed(2)})` : ''}`);
}
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const withJev = rows.filter((r) => r.jev && r.jev.delta != null && r.local.delta != null);
const agreeSign = withJev.filter((r) => Math.sign(r.jev.delta) === Math.sign(r.local.delta)).length;
const summary = { n: rows.length, localMeanDelta: mean(rows.map((r) => r.local.delta).filter((x) => x != null)), jevMeanDelta: mean(withJev.map((r) => r.jev.delta)), signAgreement: withJev.length ? `${agreeSign}/${withJev.length}` : null, jevInputTokens: jevTokens, jevErrors, jevCostUSD: +(jevTokens / 1e6 * 0.042).toFixed(4) };
console.log(JSON.stringify(summary));
writeFileSync(`experiments/judge/compare-readers-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ summary, rows }, null, 2));
