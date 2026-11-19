// Exploratory regrade of the EXP-39 / EXP-40 runs with the format-independent extractor
// (research-machine-only §4 step 2; design 23 §5 stage 0c, second edition). Not a verdict: the
// preregistered EXP-39/40 results stand. Question: how many of the trials the regex detectors
// read as "no decision block" carry a decision structure that two 8B lineages extract and agree
// on, and how often a "trivial" declaration is read as such.
//
// For each trial: the agent's prose written before the first implementation edit (same cut as the
// post-hoc-fixed EXP-39/40 analysers) is joined and extracted by both lineages. Output per trial:
// status (ok / abstain), options count, adopted present, trivial_claim; plus the old detectors.
// Needs ollama (not while Harbor runs). Usage: node experiments/judge/regrade-extract-39-40.mjs [runs/2026-11-04] [--out f]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { eventTable, fileRole } from '../../packages/pit-wall/src/graders/process/events.mjs';
import { authoredTexts } from '../../packages/pit-wall/src/graders/process/authored.mjs';
import { createHash } from 'node:crypto';
import { extractBatch } from '../../packages/pit-wall/src/graders/process/judge/extract.mjs';
import { e1 } from '../structure/analyze-exp39.mjs';
import { e2 } from '../structure/analyze-exp40.mjs';

const root = process.argv[2] ?? 'runs/2026-11-04';
const out = process.argv.find((a) => a.startsWith('--out='))?.slice(6) ?? `experiments/judge/regrade-extract-39-40-${new Date().toISOString().slice(0, 10)}.json`;
const MODELS = ['qwen3:8b', 'granite3.3:8b'];
const CELLS = ['t5-stale-base-weak', 'h5-a1', 'd3-3'];
const SETS = { exp39: ['default', 'v6'], exp40: ['default', 'v7'] };

// Prose before the first implementation edit, joined (bounded for the 8B context).
function proseBeforeImpl(record) {
  const table = eventTable(record);
  const authored = authoredTexts(record, table);
  const implIdx = table.events.findIndex((e) => (e.writes ?? []).some((w) => fileRole(w.path) === 'impl'));
  const cut = implIdx < 0 ? Infinity : table.events[implIdx].pos;
  const texts = authored.filter((a) => a.prose && (a.pos ?? 0) < cut).map((a) => String(a.text));
  let s = texts.join('\n\n---\n\n');
  if (s.length > 14000) s = s.slice(-14000); // the decision is usually written last, before the edit
  return s;
}

// Pass 1: collect every trial's prose. Pass 2: extract model-major (one load per model), cached.
const CACHE = 'experiments/judge/e-cache-extract.json';
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const items = [];
for (const [exp, arms] of Object.entries(SETS)) for (const c of CELLS) for (const a of arms) {
  const p = join(root, `${exp}-${c}-${a}`, 'results.json');
  if (!existsSync(p)) { console.log(`missing ${p}`); continue; }
  for (const r of JSON.parse(readFileSync(p, 'utf8')).records.filter((r) => r.validity?.status !== 'invalid')) items.push({ exp, c, a, r, text: proseBeforeImpl(r) });
}
const settledByText = await extractBatch(MODELS, items.map((x) => x.text), { cache, hash: sha, onProgress: (m, i, n) => { if (i % 10 === 0 || i === n) { console.log(`${m}: ${i}/${n}`); writeFileSync(CACHE, JSON.stringify(cache)); } } });
writeFileSync(CACHE, JSON.stringify(cache));
const rows = [];
const tally = {};
for (const { exp, c, a, r, text } of items) {
  const key = `${exp}:${a}`; tally[key] ??= { n: 0, ok: 0, abstain: 0, options2: 0, trivial: 0, oldE1: 0, oldE2: 0 };
  {
    const res = text.trim() ? settledByText.get(text) : { status: 'abstain', reason: 'no prose', out: null };
    const o = res.out;
    const row = { exp, cell: c, arm: a, trial: r.trial ?? r.harborTrial, status: res.status, reason: res.reason ?? null, options: o?.options?.length ?? null, adopted: o ? o.options.some((x) => x.adopted) : null, trivial: o?.trivial_claim ?? null, oldE1: e1(r).e1, oldE2: e2(r).e2, chars: text.length };
    rows.push(row);
    const t = tally[key]; t.n++; if (res.status === 'ok') t.ok++; else t.abstain++; if ((row.options ?? 0) >= 2) t.options2++; if (row.trivial) t.trivial++; if (row.oldE1) t.oldE1++; if (row.oldE2) t.oldE2++;
    console.log(`${exp} ${c} ${a} #${row.trial}: ${res.status}${res.reason ? `(${res.reason})` : ''} options=${row.options} trivial=${row.trivial} | old E1=${row.oldE1} E2=${row.oldE2}`);
  }
}
console.log('\n| set | n | extraction ok | abstain | >=2 options | trivial claim | old E1 | old E2 |\n|---|---|---|---|---|---|---|---|');
for (const [k, t] of Object.entries(tally)) console.log(`| ${k} | ${t.n} | ${t.ok} | ${t.abstain} | ${t.options2} | ${t.trivial} | ${t.oldE1} | ${t.oldE2} |`);
writeFileSync(out, JSON.stringify({ tally, rows }, null, 2));
console.log(`-> ${out}`);
