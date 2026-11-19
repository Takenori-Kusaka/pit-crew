// Can a model extract from REAL agent prose under the verbatim rule? Takes N texts from the EXP-32
// runs (fixed-seed sample across arms), extracts with the given model(s), and reports per model:
// valid (quote + count checks) / quote failed / count failed / empty structure; and, for two models,
// the agreement rate on texts both found a structure in. Exploratory: no verdict about arms.
// Usage: node experiments/judge/probe-extract-real.mjs --models=qwen3:8b,llama3.1:8b [--n=40] [runs/2026-11-04]
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { eventTable, fileRole } from '../../packages/pit-wall/src/graders/process/events.mjs';
import { authoredTexts } from '../../packages/pit-wall/src/graders/process/authored.mjs';
import { extractBatch, quoteCheck, countCheck, canonical } from '../../packages/pit-wall/src/graders/process/judge/extract.mjs';

const args = process.argv.slice(2);
const MODELS = (args.find((a) => a.startsWith('--models='))?.slice(9) ?? 'qwen3:8b,llama3.1:8b').split(',');
const N = Number(args.find((a) => a.startsWith('--n='))?.slice(4) ?? 40);
const root = args.find((a) => !a.startsWith('--')) ?? 'runs/2026-11-04';
const CACHE = 'experiments/judge/e-cache-extract.json';
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
function prose(record) {
  const table = eventTable(record); const authored = authoredTexts(record, table);
  const implIdx = table.events.findIndex((e) => (e.writes ?? []).some((w) => fileRole(w.path) === 'impl'));
  const cut = implIdx < 0 ? Infinity : table.events[implIdx].pos;
  let s = authored.filter((a) => a.prose && (a.pos ?? 0) < cut).map((a) => String(a.text)).join('\n\n---\n\n');
  return s.length > 14000 ? s.slice(-14000) : s;
}
const all = [];
for (const suite of ['heldout', 'd3']) for (const c of (suite === 'heldout' ? ['h5-a1', 'h5-b1', 'h5-c1', 'h5-d1'] : ['d3-3', 'd3-4'])) for (const a of ['vanilla', 'v0', 'v1', 'default']) {
  const p = join(root, `exp32-${suite}-${c}-${a}`, 'results.json'); if (!existsSync(p)) continue;
  for (const r of JSON.parse(readFileSync(p, 'utf8')).records) if (r.validity?.status !== 'invalid') { const t = prose(r); if (t.trim()) all.push({ a, t }); }
}
let seed = 20261105; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const sample = all.map((x) => ({ ...x, k: rnd() })).sort((x, y) => x.k - y.k).slice(0, N);
const settled = await extractBatch(MODELS, sample.map((x) => x.t), { cache, hash: sha, onProgress: (m, i, n) => { if (i % 10 === 0 || i === n) { console.log(`${m}: ${i}/${n}`); writeFileSync(CACHE, JSON.stringify(cache)); } } });
writeFileSync(CACHE, JSON.stringify(cache));
const per = Object.fromEntries(MODELS.map((m) => [m, { valid: 0, quoteFail: 0, countFail: 0, noOut: 0, empty: 0, structured: 0 }]));
let both = 0, agree = 0;
for (const { t } of sample) {
  const outs = {};
  MODELS.forEach((m, i) => {
    const raw = settled.get(t)?.raws?.[i]; const s = per[m];
    if (!raw?.out) { s.noOut++; return; }
    const q = quoteCheck(t, raw.out), k = countCheck(raw.out);
    if (!q.ok) s.quoteFail++; if (!k.ok) s.countFail++;
    if ((raw.out.options ?? []).length === 0) s.empty++; else s.structured++;
    if (q.ok && k.ok) { s.valid++; outs[m] = raw.out; }
  });
  if (MODELS.length === 2 && outs[MODELS[0]] && outs[MODELS[1]] && (outs[MODELS[0]].options ?? []).length && (outs[MODELS[1]].options ?? []).length) { both++; if (canonical(outs[MODELS[0]]) === canonical(outs[MODELS[1]])) agree++; }
}
console.log(`sample ${sample.length} of ${all.length}`);
for (const m of MODELS) console.log(`${m}: valid ${per[m].valid}, quote failed ${per[m].quoteFail}, count failed ${per[m].countFail}, no output ${per[m].noOut}, structure found ${per[m].structured}, none ${per[m].empty}`);
if (MODELS.length === 2) console.log(`both valid with structure ${both}, agree ${agree}`);
