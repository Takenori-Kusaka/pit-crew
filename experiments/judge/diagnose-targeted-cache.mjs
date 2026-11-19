// Why does targeted extraction abstain on real EXP-32 prose? Re-applies the mechanical checks to the
// CACHED raw outputs (no model calls) and tallies, per lineage: valid / invalid by problem type, and
// how many planted options each lineage marks as mentioned. Also counts why points were skipped
// (no prose before the first implementation edit vs no planted options). Exploratory; reads nothing
// but the agent's own text and the extractor's output.
// Usage: node experiments/judge/diagnose-targeted-cache.mjs [runs/2026-11-04]
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eventTable, fileRole } from '../../packages/pit-wall/src/graders/process/events.mjs';
import { authoredTexts } from '../../packages/pit-wall/src/graders/process/authored.mjs';
import { targetedCheck, targetedSkeleton } from '../../packages/pit-wall/src/graders/process/judge/extract.mjs';
import * as H5 from '../heldout-s5/decision-correct.mjs';
import * as D3 from '../d3/decision-correct.mjs';

const root = process.argv[2] ?? 'runs/2026-11-04';
const MODELS = ['qwen3:8b', 'llama3.1:8b'];
const ARMS = ['vanilla', 'v0', 'v1', 'default'];
const SUITES = { heldout: { mod: H5, cells: ['h5-a1', 'h5-b1', 'h5-c1', 'h5-d1'] }, d3: { mod: D3, cells: ['d3-3', 'd3-4'] } };
const cache = JSON.parse(readFileSync('experiments/judge/e-cache-extract.json', 'utf8'));
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const key = (m, text, options) => `${m}:T2:${sha(`${text}\u0000${JSON.stringify(options)}`)}`;

// Same as e-series-2x2.mjs/proseBeforeImpl (kept in sync by hand; the script has top-level execution).
function proseBeforeImpl(record) {
  const table = eventTable(record);
  const authored = authoredTexts(record, table);
  const implIdx = table.events.findIndex((e) => (e.writes ?? []).some((w) => fileRole(w.path) === 'impl'));
  const cut = implIdx < 0 ? Infinity : table.events[implIdx].pos;
  let s = authored.filter((a) => a.prose && (a.pos ?? 0) < cut).map((a) => String(a.text)).join('\n\n---\n\n');
  if (s.length > 14000) s = s.slice(-14000);
  return s;
}

const skipped = { noProse: 0, noOptions: 0 }, perModel = {}, agree = { bothValid: 0, sameSkeleton: 0 };
const mentionsBy = {}; // model -> histogram of mentioned count
const textLen = [];
for (const m of MODELS) { perModel[m] = { valid: 0, invalid: 0, missingRaw: 0, problems: {}, missingQuotes: 0 }; mentionsBy[m] = {}; }
let n = 0;
for (const [suite, { mod, cells }] of Object.entries(SUITES)) for (const c of cells) for (const a of ARMS) {
  const p = join(root, `exp32-${suite}-${c}-${a}`, 'results.json');
  if (!existsSync(p)) continue;
  for (const r of JSON.parse(readFileSync(p, 'utf8')).records) {
    if (r.validity?.status === 'invalid') continue;
    const text = proseBeforeImpl(r);
    for (const pid of mod.decidablePointIds(c)) {
      const planted = (mod.REGISTRY[c][pid].options ?? []).map((o) => ({ id: o.id, text: o.text }));
      if (!planted.length) { skipped.noOptions++; continue; }
      if (!text.trim()) { skipped.noProse++; continue; }
      n++; textLen.push(text.length);
      const outs = [];
      for (const m of MODELS) {
        const raw = cache[key(m, text, planted)]; const pm = perModel[m];
        if (!raw) { pm.missingRaw++; outs.push(null); continue; }
        if (!raw.out) { pm.invalid++; pm.problems[raw.error?.slice(0, 40) ?? 'no output'] = (pm.problems[raw.error?.slice(0, 40) ?? 'no output'] ?? 0) + 1; outs.push(null); continue; }
        const chk = targetedCheck(text, planted, raw.out);
        const mentioned = raw.out.options.filter((o) => o.mentioned).length; mentionsBy[m][mentioned] = (mentionsBy[m][mentioned] ?? 0) + 1;
        if (chk.ok) { pm.valid++; outs.push(raw.out); } else { pm.invalid++; outs.push(null); if (chk.missing.length) pm.missingQuotes++; for (const pr of chk.problems) { const k = pr.replace(/^[^:]+: /, ''); pm.problems[k] = (pm.problems[k] ?? 0) + 1; } }
      }
      if (outs.every(Boolean)) { agree.bothValid++; if (targetedSkeleton(outs[0]) === targetedSkeleton(outs[1])) agree.sameSkeleton++; }
    }
  }
}
textLen.sort((x, y) => x - y);
console.log(JSON.stringify({ points: n, skipped, textLenMedian: textLen[Math.floor(textLen.length / 2)], agree, perModel, mentionsBy }, null, 1));
