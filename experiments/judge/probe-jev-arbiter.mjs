// Can Jev (Noul) serve as the SECOND lineage for the targeted-extraction skeleton? llama3.1 marks
// nearly every planted option as mentioned on real prose (valid 87/577), so the two-lineage rule
// yields 30/577. This probe asks Jev, per planted option, "mentioned?" and "adopted?" on a sample of
// points where qwen3's extraction passed the mechanical checks, and reports skeleton agreement
// qwen vs Jev. Exploratory; prints no key; reports cost. Usage: node experiments/judge/probe-jev-arbiter.mjs [--n=60]
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { eventTable, fileRole } from '../../packages/pit-wall/src/graders/process/events.mjs';
import { authoredTexts } from '../../packages/pit-wall/src/graders/process/authored.mjs';
import { targetedCheck, targetedSkeleton } from '../../packages/pit-wall/src/graders/process/judge/extract.mjs';
import { apiKey, systemOne, arbitrationQuestions } from '../../packages/pit-wall/src/graders/process/judge/jev.mjs';
import * as H5 from '../heldout-s5/decision-correct.mjs';
import * as D3 from '../d3/decision-correct.mjs';

if (!apiKey()) { console.error('no key'); process.exit(2); }
const N = Number(process.argv.find((a) => a.startsWith('--n='))?.slice(4) ?? 60);
const root = 'runs/2026-11-04';
const ARMS = ['vanilla', 'v0', 'v1', 'default'];
const SUITES = { heldout: { mod: H5, cells: ['h5-a1', 'h5-b1', 'h5-c1', 'h5-d1'] }, d3: { mod: D3, cells: ['d3-3', 'd3-4'] } };
const cache = JSON.parse(readFileSync('experiments/judge/e-cache-extract.json', 'utf8'));
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const key = (m, text, options) => `${m}:T2:${sha(`${text}\u0000${JSON.stringify(options)}`)}`;
function proseBeforeImpl(record) {
  const table = eventTable(record); const authored = authoredTexts(record, table);
  const implIdx = table.events.findIndex((e) => (e.writes ?? []).some((w) => fileRole(w.path) === 'impl'));
  const cut = implIdx < 0 ? Infinity : table.events[implIdx].pos;
  let s = authored.filter((a) => a.prose && (a.pos ?? 0) < cut).map((a) => String(a.text)).join('\n\n---\n\n');
  if (s.length > 14000) s = s.slice(-14000);
  return s;
}
const pool = [];
for (const [suite, { mod, cells }] of Object.entries(SUITES)) for (const c of cells) for (const a of ARMS) {
  const p = join(root, `exp32-${suite}-${c}-${a}`, 'results.json'); if (!existsSync(p)) continue;
  for (const r of JSON.parse(readFileSync(p, 'utf8')).records) {
    if (r.validity?.status === 'invalid') continue;
    const text = proseBeforeImpl(r); if (!text.trim()) continue;
    for (const pid of mod.decidablePointIds(c)) {
      const planted = (mod.REGISTRY[c][pid].options ?? []).map((o) => ({ id: o.id, text: o.text }));
      const raw = cache[key('qwen3:8b', text, planted)];
      if (!raw?.out || !targetedCheck(text, planted, raw.out).ok) continue;
      pool.push({ cell: c, arm: a, trial: r.trial ?? r.harborTrial, pid, text, planted, qwen: raw.out });
    }
  }
}
let seed = 20261105; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const sample = pool.map((x) => ({ ...x, k: rnd() })).sort((x, y) => x.k - y.k).slice(0, N);
console.log(`qwen-valid pool ${pool.length}, sample ${sample.length}`);
let tokens = 0, errors = 0, shownRaw = false;
// Noul answers are probabilities ({ type: 'noul', noul: 0.67 }, observed 2026-11-05); threshold 0.5.
const bool = (ans) => { if (!ans) return null; if (typeof ans.noul === 'number') return ans.noul >= 0.5; if (typeof ans.noul === 'boolean') return ans.noul; return null; };
const rows = []; let agree = 0, mentionAgree = 0, mentionN = 0, adoptAgree = 0, adoptN = 0, incomplete = 0;
for (const pt of sample) {
  const jevOpts = [];
  for (const o of pt.planted) {
    const { state, questions } = arbitrationQuestions(pt.text, o.text);
    const r = await systemOne(state, questions).catch((e) => { errors++; return { error: String(e.message ?? e) }; });
    if (r.error) { if (!shownRaw) { console.log('error sample:', r.error.slice(0, 300)); shownRaw = true; } jevOpts.push(null); continue; }
    if (!shownRaw) { console.log('raw answer sample:', JSON.stringify(r.answers).slice(0, 400)); shownRaw = true; }
    tokens += r.usage?.input_tokens ?? 0;
    const mentioned = bool(r.answers?.mentioned), adopted = bool(r.answers?.adopted);
    jevOpts.push({ id: o.id, mentioned: !!mentioned, claimed_adopted: !!adopted && !!mentioned, pros: [], cons: [], raw: r.answers });
  }
  if (jevOpts.some((x) => !x)) { incomplete++; continue; }
  const jevSkel = targetedSkeleton({ options: jevOpts, trivial_claim: !!pt.qwen.trivial_claim });
  const same = jevSkel === targetedSkeleton(pt.qwen);
  if (same) agree++;
  for (const o of pt.qwen.options) { const j = jevOpts.find((x) => x.id === o.id); mentionN++; if (!!o.mentioned === j.mentioned) mentionAgree++; if (o.mentioned && j.mentioned) { adoptN++; if (!!o.claimed_adopted === j.claimed_adopted) adoptAgree++; } }
  rows.push({ cell: pt.cell, arm: pt.arm, trial: pt.trial, pid: pt.pid, same, qwen: pt.qwen.options.map((o) => [o.id, !!o.mentioned, !!o.claimed_adopted]), jev: jevOpts.map((o) => [o.id, o.mentioned, o.claimed_adopted, o.raw]) });
}
const summary = { sample: sample.length, incomplete, skeletonAgree: `${agree}/${rows.length}`, mentionAgree: `${mentionAgree}/${mentionN}`, adoptionAgreeWhenBothMention: `${adoptAgree}/${adoptN}`, jevInputTokens: tokens, errors, costUSD: +(tokens / 1e6 * 0.042).toFixed(4) };
console.log(JSON.stringify(summary));
writeFileSync(`experiments/judge/probe-jev-arbiter-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ summary, rows }, null, 2));
