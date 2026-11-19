// Why does the extractor abstain on real agent prose? Reads the extraction cache (raw outputs of
// both lineages per text) and the texts rebuilt from the EXP-32 runs; reports per model: no output /
// quote check failed / count check failed / valid, and for pairs: agree / disagree, with the
// commonest kinds of difference. Synthetic-free diagnosis: the texts are the agents' own notes
// (exploratory material, not a verdict).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eventTable, fileRole } from '../../packages/pit-wall/src/graders/process/events.mjs';
import { authoredTexts } from '../../packages/pit-wall/src/graders/process/authored.mjs';
import { quoteCheck, countCheck, canonical } from '../../packages/pit-wall/src/graders/process/judge/extract.mjs';

const root = process.argv[2] ?? 'runs/2026-11-04';
const MODELS = ['qwen3:8b', 'granite3.3:8b'];
const cache = JSON.parse(readFileSync('experiments/judge/e-cache-extract.json', 'utf8'));
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
function prose(record) {
  const table = eventTable(record); const authored = authoredTexts(record, table);
  const implIdx = table.events.findIndex((e) => (e.writes ?? []).some((w) => fileRole(w.path) === 'impl'));
  const cut = implIdx < 0 ? Infinity : table.events[implIdx].pos;
  let s = authored.filter((a) => a.prose && (a.pos ?? 0) < cut).map((a) => String(a.text)).join('\n\n---\n\n');
  return s.length > 14000 ? s.slice(-14000) : s;
}
const texts = new Set();
for (const suite of ['heldout', 'd3']) for (const c of (suite === 'heldout' ? ['h5-a1', 'h5-b1', 'h5-c1', 'h5-d1'] : ['d3-3', 'd3-4'])) for (const a of ['vanilla', 'v0', 'v1', 'default']) {
  const p = join(root, `exp32-${suite}-${c}-${a}`, 'results.json'); if (!existsSync(p)) continue;
  for (const r of JSON.parse(readFileSync(p, 'utf8')).records) if (r.validity?.status !== 'invalid') { const t = prose(r); if (t.trim()) texts.add(t); }
}
const per = Object.fromEntries(MODELS.map((m) => [m, { n: 0, noOut: 0, quoteFail: 0, countFail: 0, valid: 0, emptyOptions: 0, missExamples: [] }]));
let pairs = 0, agree = 0, bothValid = 0, diffAdopted = 0, diffNOptions = 0, diffArgs = 0;
for (const t of texts) {
  const outs = {};
  for (const m of MODELS) {
    const raw = cache[`${m}:${sha(t)}`]; const s = per[m]; s.n++;
    if (!raw?.out) { s.noOut++; continue; }
    const q = quoteCheck(t, raw.out), k = countCheck(raw.out);
    if (!q.ok) { s.quoteFail++; if (s.missExamples.length < 6) s.missExamples.push(q.missing.slice(0, 2).map((x) => String(x).slice(0, 70))); }
    if (!k.ok) s.countFail++;
    if (q.ok && k.ok) { s.valid++; outs[m] = raw.out; }
    if ((raw.out.options ?? []).length === 0) s.emptyOptions++;
  }
  pairs++;
  if (outs[MODELS[0]] && outs[MODELS[1]]) {
    bothValid++;
    const a = outs[MODELS[0]], b = outs[MODELS[1]];
    if (canonical(a) === canonical(b)) agree++;
    else {
      if ((a.options ?? []).length !== (b.options ?? []).length) diffNOptions++;
      else if (a.options.some((o, i) => o.adopted !== b.options[i]?.adopted)) diffAdopted++;
      else diffArgs++;
    }
  }
}
console.log(`texts ${texts.size}`);
for (const m of MODELS) { const s = per[m]; console.log(`${m}: no output ${s.noOut}, quote check failed ${s.quoteFail}, count check failed ${s.countFail}, valid ${s.valid}, empty options ${s.emptyOptions}`); console.log('  missing-quote examples:', JSON.stringify(s.missExamples).slice(0, 700)); }
console.log(`pairs ${pairs}: both valid ${bothValid}, agree ${agree}; disagreements: option count ${diffNOptions}, adoption ${diffAdopted}, arguments ${diffArgs}`);
