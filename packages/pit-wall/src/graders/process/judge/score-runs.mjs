#!/usr/bin/env node
// EXP-32 E series (rationale quality), secondary measure (card: docs/experiments/EXP-20261104-32-
// process-conformance.md "E 系列の judge（段 0c）は、検証を通った項目だけを副の量に入れる"; owner's
// decision 2026-11-04 in planning 23 §10: R2 / R4 / R5 by the light Claude model on the subscription,
// S2 by the jury). Exploratory: the judge was validated on a small scripted set; this is not a verdict.
//
// For every valid record of the EXP-32 run directories (runs/<date>/exp32-<group>-<cell>-<arm>):
//   - R2 / R4 / R5: one evidence bundle per registered decision point of the cell. The agent's
//     paragraphs are attributed to a decision point by the evaluator's keyword file
//     (experiments/judge/exp32-decision-keywords.json). A decision point the agent wrote nothing
//     about is "no-statement" = not-met without a judge call; R2 with fewer than two option spans
//     and R5 with no alternatives at all are also decided by program. The rest go to Claude.
//   - S2: one bundle per citation that grounding.mjs classified O / P without S1 support (the cited
//     file was visible, but whether the sentence is supported needs a judge). Sampled per arm.
//     Jury = claude + qwen3:8b + granite3.3:8b, majority (jurors.mjs).
//   - arm blindness: one extra Claude call per 20 judged bundles asks which of four setups produced
//     the (normalised) bundle; accuracy against chance 0.25.
// Claude calls are bounded: the R-item sample (k trials per cell per arm, same k everywhere) is the
// largest k whose judge calls fit --r-budget; S2 is capped at --s2-per-arm. Raw answers are cached
// (runs/<date>/exp32-E-cache.json) so jurors can run in separate invocations (Claude from Windows,
// the open models from WSL) and merge.
//
// Usage:
//   node packages/pit-wall/src/graders/process/judge/score-runs.mjs [--runs runs/2026-11-04]
//        [--jurors claude | qwen,granite | none] [--plan] [--dry] [--r-budget 200] [--s2-per-arm 40]
//        [--no-blind]
//   --plan   build everything, print the sample plan and call counts, make no model call
//   --dry    print one R2 and one S2 prompt and exit
//   --jurors none  settle from the cache only and write the output file

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { eventTable } from '../events.mjs';
import { authoredTexts, contentTypes } from '../authored.mjs';
import { visibility } from '../visibility.mjs';
import { extractCitations, classify } from '../grounding.mjs';
import { buildBundle, stripFormat, renderBundle } from './bundle.mjs';
import { buildPrompt, SYSTEM } from './items.mjs';
import { JURORS, NUM_CTX, CTX_LIMIT, estimateTokens, runJuror, settle, majority } from './jurors.mjs';
import { claudeJson } from '../../../judge.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../../..');
const rel = (p) => join(ROOT, p);

export const GROUPS = {
  dev: { cells: ['t4-scatter-big-start', 't5-stale-base-weak'], points: 'experiments/process/decision-points-dev.json' },
  heldout: { cells: ['h5-a1', 'h5-b1', 'h5-c1', 'h5-d1'], points: 'experiments/heldout-s5/decision-points.json', detail: 'experiments/heldout-s5/decision-points-detail.json' },
  d3: { cells: ['d3-3', 'd3-4'], points: 'experiments/d3/decision-points.json', detail: 'experiments/d3/decision-points-detail.json' },
};
export const ARMS = ['vanilla', 'v0', 'v1', 'default'];
const R_ITEMS = ['R2', 'R4', 'R5'];
const HEADER_NOTE = 'exploratory secondary measure (E series), judge validated on a small set; not a verdict';

function args(argv) {
  const a = { runs: 'runs/2026-11-04', jurors: ['claude'], plan: false, dry: false, rBudget: 200, s2PerArm: 40, blind: true, blindEvery: 20 };
  for (let i = 2; i < argv.length; i++) {
    const x = argv[i];
    if (x === '--runs') a.runs = argv[++i];
    else if (x === '--jurors') { const v = argv[++i]; a.jurors = v === 'none' ? [] : v.split(','); }
    else if (x === '--plan') a.plan = true;
    else if (x === '--dry') a.dry = true;
    else if (x === '--r-budget') a.rBudget = Number(argv[++i]);
    else if (x === '--s2-per-arm') a.s2PerArm = Number(argv[++i]);
    else if (x === '--no-blind') a.blind = false;
    else if (x === '--cache') a.cache = argv[++i];
    else throw new Error(`unknown argument ${x}`);
  }
  return a;
}

// ------------------------------------------------------------------ registration
// Decision points per cell: [{ id, category, description }]. Descriptions come from the detail file
// (held-out / D3: evaluator only) or the dev registration; they go into the bundle's task span, never
// into the output file.
export function loadPoints() {
  const out = {};
  for (const [g, cfg] of Object.entries(GROUPS)) {
    const pts = JSON.parse(readFileSync(rel(cfg.points), 'utf8'));
    const detail = cfg.detail ? JSON.parse(readFileSync(rel(cfg.detail), 'utf8')) : null;
    for (const c of cfg.cells) {
      if (!pts[c]) throw new Error(`${g}/${c}: no registered decision points in ${cfg.points}`);
      out[c] = pts[c].map((p) => {
        const d = p.description ?? detail?.[c]?.[p.id] ?? detail?.[p.id] ?? null;
        if (!d) throw new Error(`${g}/${c}/${p.id}: no description`);
        return { id: p.id, category: p.category, description: d };
      });
    }
  }
  return out;
}
export function loadKeywords() {
  const kw = JSON.parse(readFileSync(rel('experiments/judge/exp32-decision-keywords.json'), 'utf8'));
  const out = {};
  for (const [cell, m] of Object.entries(kw)) if (!cell.startsWith('_')) out[cell] = Object.fromEntries(Object.entries(m).map(([id, re]) => [id, new RegExp(re, 'i')]));
  return out;
}

// ------------------------------------------------------------------ records
export function loadRecords(runsDir) {
  const dir = rel(runsDir);
  const out = [];
  for (const d of readdirSync(dir)) {
    const m = d.match(/^exp32-(dev|heldout|d3)-(.+)-(vanilla|v0|v1|default)$/);
    if (!m || !existsSync(join(dir, d, 'results.json'))) continue;
    const [, group, cell, arm] = m;
    if (!GROUPS[group]?.cells.includes(cell)) continue;
    const doc = JSON.parse(readFileSync(join(dir, d, 'results.json'), 'utf8'));
    for (const r of doc.records ?? []) {
      if (!r.trajectory || String(r.arm).startsWith('script:')) continue;
      out.push({ id: `${d}/${r.trial ?? r.harborTrial}`, dir: d, group, cell, arm, trial: r.trial ?? r.harborTrial, valid: r.validity?.status !== 'invalid', record: r });
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

// The task as the no-harness arm received it (the same text sits inside every arm's instruction as
// the skill argument); the issue body arrives as an observation.
function plainTask(table) {
  const ins = String(table.instruction ?? '');
  const m = ins.match(/<command-args>([\s\S]*?)<\/command-args>/);
  return (m ? m[1] : ins).trim();
}

// Prose paragraphs with the position they were written at.
export function paragraphsOf(authored) {
  const out = [];
  for (const a of authored) if (a.prose) for (const p of String(a.text).replace(/\r\n?/g, '\n').split(/\n\s*\n/)) if (p.trim()) out.push({ pos: a.pos, where: a.where, text: p.trim() });
  return out;
}

// Tool results the agent saw that are not its own text echoed back (cat of its notes).
function foreignCorpus(vis) {
  return vis.corpus.filter((c) => {
    if (c.pos < 0) return false; // the instruction and auto-loaded files are not observations of this task's code
    const lines = c.text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l.length >= 6);
    if (!lines.length) return false;
    const own = lines.filter((l) => vis.agentLines.has(l)).length;
    return own / lines.length < 0.5;
  });
}

const sentenceAt = (text, idx) => {
  const s = text.lastIndexOf('\n', idx);
  const startDot = Math.max(s, ...['. ', '。'].map((d) => text.lastIndexOf(d, idx)));
  let end = text.length;
  for (const d of ['\n', '. ', '。']) { const k = text.indexOf(d, idx); if (k !== -1 && k < end) end = k; }
  return text.slice(startDot + 1, end).trim();
};

// Option spans for R2: list items of an alternatives paragraph, or lines that carry an option marker.
const OPT_MARK = /(^|\s)(案|選択肢|代替案?|別案|方法|方針|手段|アプローチ)\s*[A-Za-z0-9０-９①②③④一二三]|\b(?:option|alternative|approach|choice)\s*[A-Za-z0-9]\b|[①②③④]|\b(?:instead of|rather than|vs\.?|versus)\b|(?:か、|または|あるいは|もしくは|ではなく|の代わりに|対案|という(?:案|方法|手)|採用|却下|不採用|選択し|選ば|選ん|採ら|採る)/i;
const LIST_LINE = /^\s*(?:[-*+•・]|\d+[.)]|\(\d+\)|[a-z][.)]|[①②③④])\s+/;
// Japanese adoption marks that bundle.mjs's hideAdoption (English + bracketed 採用/却下) leaves in
// place: a clause or sentence that says which option was taken is dropped from the option span.
const ADOPT_JA = /(採用|採らない|採りません|採った|採る|却下|不採用|選択した|選んだ|選ぶ|こちらにする|こちらを採|これを採|に決め|とした|を選)/;
export function hideAdoptionJa(text) {
  // Sentence ends: 。 anywhere; . ! only before whitespace or the end (not inside staging.yml).
  return String(text).split(/(?<=。)\s*|(?<=[.!！])(?=\s|$)\s*|\s*(?:→|⇒|=>)\s*/).filter((s) => s.trim() && !ADOPT_JA.test(s)).join(' ').replace(/[ \t]+/g, ' ').trim();
}
export function extractOptions(paragraphs) {
  const out = [];
  for (const p of paragraphs) {
    const raw = p.text.split('\n');
    const items = raw.filter((l) => LIST_LINE.test(l));
    const tableRows = raw.filter((l) => /^\s*\|/.test(l) && !/^\s*\|?\s*:?-{3,}/.test(l));
    const alt = contentTypes(p.text).alternatives;
    const lines = alt && tableRows.length >= 3 ? tableRows.slice(1) : alt && items.length >= 2 ? items : stripFormat(p.text).split('\n').filter((l) => OPT_MARK.test(l));
    for (const l of lines) { const t = hideAdoptionJa(stripFormat(l)); if (t.length >= 15 && !out.includes(t)) out.push(t.slice(0, 400)); }
  }
  return out.slice(0, 6);
}

// ------------------------------------------------------------------ bundles
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const SELF_ACTION = /(追加|修正|変更|作成|更新|削除|編集|移動|置換|導入|実装|直し|書き換え|リネーム|改名|戻し)(し|す|済|、|。|\s|$)|\b(?:added|changed|updated|created|edited|modified|moved|fixed|implemented|wrote|renamed|removed|deleted|revert(?:ed)?|restored?)\b/i;
const WRITE_ACK = /^(?:The file .* has been (?:updated|created) successfully|File created successfully|Applied \d+ edits?)/m;

export function analyse(rec, points, keywords) {
  const table = eventTable(rec.record);
  const authored = authoredTexts(rec.record, table);
  const vis = visibility(table, authored);
  const task = plainTask(table);
  const paragraphs = paragraphsOf(authored);
  const corpus = foreignCorpus(vis);
  const issue = table.events.find((e) => e.shown && e.command && /\bgh issue view\b/.test(e.command) && e.resultText.trim());
  const issueObs = issue ? { tool: 'gh issue view', text: issue.resultText.slice(0, 2400) } : null;
  const R = [];
  for (const dp of points[rec.cell] ?? []) {
    const re = keywords[rec.cell]?.[dp.id];
    if (!re) throw new Error(`${rec.cell}/${dp.id}: no keywords`);
    const rels = paragraphs.filter((p) => re.test(p.text)).slice(0, 12).map((p) => ({ ...p, text: p.text.slice(0, 1500) }));
    const base = { id: `${rec.id}:${dp.id}`, rec: rec.id, group: rec.group, cell: rec.cell, arm: rec.arm, trial: rec.trial, dp: dp.id, category: dp.category };
    if (!rels.length) { for (const item of R_ITEMS) R.push({ ...base, item, deterministic: 'no-statement', verdict: 'not-met' }); continue; }
    const maxPos = Math.max(...rels.map((p) => p.pos));
    const words = new Set(rels.map((p) => p.text).join(' ').match(/[A-Za-z_][\w.-]{3,}|\d{2,}/g) ?? []);
    const obs = corpus.filter((c) => c.pos < maxPos && c !== issue)
      .map((c) => ({ text: c.text, score: [...words].filter((w) => c.text.includes(w)).length })).filter((o) => o.score > 0).slice(-4).map((o) => ({ text: o.text }));
    const observations = [...(issueObs ? [issueObs] : []), ...obs];
    const taskText = `${task}\n\nDecision under review: ${dp.description}`;
    const options = extractOptions(rels);
    const hasAlt = rels.some((p) => contentTypes(p.text).alternatives);
    for (const item of R_ITEMS) {
      if (item === 'R2' && options.length < 2) { R.push({ ...base, item, deterministic: 'fewer-than-2-options', verdict: 'not-met', options: options.length }); continue; }
      if (item === 'R5' && options.length < 2 && !hasAlt) { R.push({ ...base, item, deterministic: 'no-alternatives', verdict: 'not-met' }); continue; }
      const c = { id: base.id, item, task: taskText, observations, authored: rels.map((p) => p.text), options: item === 'R2' ? options : undefined };
      R.push({ ...base, item, bundle: buildBundle(c), options: options.length, paragraphs: rels.length });
    }
  }
  // S2 candidates: path citations that were visible (O / P) but whose sentence has no S1 support.
  const S2 = [];
  const topDirs = new Set([...vis.known].filter((k) => k.includes('/')).map((k) => k.split('/')[0]));
  const ctx = { vis, table, gitLog: rec.record?.state?.git?.log ?? null };
  for (const a of authored.filter((x) => x.prose && !['commit', 'todo'].includes(x.where))) {
    for (const cit of extractCitations(a.text, { topDirs, known: vis.known })) {
      if (cit.type !== 'path') continue;
      const sentence = sentenceAt(a.text, cit.index);
      const res = classify(cit, a.pos, ctx, sentence);
      if (!['O', 'P'].includes(res.cls) || res.support != null) continue;
      if (sentence.replace(/[`\s]/g, '').length < 20 || sentence.replace(/[`\s]/g, '') === cit.value) continue; // a bare path is not a claim
      if (SELF_ACTION.test(sentence)) continue; // "I changed X": a report of the agent's own action, not a claim about what the file says
      const path = res.path ?? cit.value, base = path.replace(/^.*\//, '');
      // The observations: results in which the file's own lines were visible (content), else results
      // that at least name it; never a write tool's confirmation.
      const distinct = vis.distinct[path] ?? [];
      const before = corpus.filter((c) => c.pos < a.pos && !WRITE_ACK.test(c.text));
      const withContent = before.filter((c) => distinct.some((l) => c.plain.has(l) || c.hits.has(l)));
      const seenIn = (withContent.length ? withContent : before.filter((c) => c.text.includes(path) || c.text.includes(base))).slice(-2);
      if (!seenIn.length) continue;
      const id = `${rec.id}:S2:${sha(`${a.pos}:${cit.index}:${sentence}`)}`;
      S2.push({ id, rec: rec.id, group: rec.group, cell: rec.cell, arm: rec.arm, trial: rec.trial, item: 'S2', path, cls: res.cls, where: a.where,
        bundle: buildBundle({ id, item: 'S2', task, observations: seenIn.map((c) => ({ text: c.text })), authored: [], claim: sentence }, { maxObsChars: 1800 }) });
    }
  }
  return { R, S2 };
}

// ------------------------------------------------------------------ sampling (deterministic)
let seed = 20261104;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
function shuffle(xs) { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// R items: the first k valid trials of every cell for every arm, k the largest that fits the budget.
function planR(recs, Rall, budget) {
  const byCellArm = {};
  for (const r of recs.filter((x) => x.valid)) (byCellArm[`${r.cell}|${r.arm}`] ??= []).push(r);
  for (const v of Object.values(byCellArm)) v.sort((a, b) => Number(a.trial) - Number(b.trial));
  const maxK = Math.max(...Object.values(byCellArm).map((v) => v.length));
  const pick = (k) => new Set(Object.values(byCellArm).flatMap((v) => v.slice(0, k).map((r) => r.id)));
  let k = 1, chosen = pick(1);
  for (let kk = 2; kk <= maxK; kk++) {
    const ids = pick(kk);
    if (Rall.filter((b) => ids.has(b.rec) && b.bundle).length > budget) break;
    k = kk; chosen = ids;
  }
  return { k, ids: chosen, calls: Rall.filter((b) => chosen.has(b.rec) && b.bundle).length };
}
// S2: per arm, round-robin over cells then records, random within a record, until n.
function planS2(S2all, n) {
  const out = [];
  for (const arm of ARMS) {
    const byCell = {};
    for (const b of S2all.filter((x) => x.arm === arm)) (byCell[b.cell] ??= []).push(b);
    const queues = Object.keys(byCell).sort().map((c) => {
      const byRec = {};
      for (const b of byCell[c]) (byRec[b.rec] ??= []).push(b);
      return Object.keys(byRec).sort().map((r) => shuffle(byRec[r]));
    });
    const picked = [];
    let any = true;
    while (picked.length < n && any) {
      any = false;
      for (const q of queues) {
        if (picked.length >= n) break;
        // next record of this cell that still has a candidate
        const recQ = q.find((x) => x.length);
        if (recQ) { picked.push(recQ.shift()); any = true; q.push(q.splice(q.indexOf(recQ), 1)[0]); }
      }
    }
    out.push(...picked);
  }
  return out;
}

// ------------------------------------------------------------------ arm blindness
const BLIND_SCHEMA = { type: 'object', properties: { setup: { enum: ['A', 'B', 'C', 'D'] }, reasoning: { type: 'string' } }, required: ['setup', 'reasoning'], additionalProperties: false };
const BLIND_SYSTEM = 'You read an evidence bundle about a software engineer\'s work and guess under which of four working setups the engineer worked. Answer with JSON: "setup" (one letter) and "reasoning" (at most 3 sentences).';
const BLIND_Q = [
  'Four setups: A = the engineer received only the task, no process instructions. B = the engineer followed a long Japanese role document written for one product team, with references to decision records and many checklists. C = the engineer followed a short English role card with "must / must not" rules. D = the engineer followed a staged development process with numbered phases, a state file and per-phase instructions.',
  'Which setup produced the work in this bundle? Guess even if unsure.',
].join('\n');
const ARM_LETTER = { vanilla: 'A', v0: 'B', v1: 'C', default: 'D' };

// ------------------------------------------------------------------ main
async function main() {
  const a = args(process.argv);
  const points = loadPoints(), keywords = loadKeywords();
  const recs = loadRecords(a.runs);
  if (!recs.length) throw new Error(`no exp32 run directories under ${a.runs}`);
  const Rall = [], S2all = [];
  const counts = {};
  for (const r of recs) {
    const c = (counts[`${r.group}|${r.arm}`] ??= { records: 0, invalid: 0 });
    c.records++;
    if (!r.valid) { c.invalid++; continue; }
    const { R, S2 } = analyse(r, points, keywords);
    Rall.push(...R); S2all.push(...S2);
    r.record = null; // the bundles hold the text they need; 400 trajectories with end states must not stay resident while the open models run (host memory)
  }
  const rPlan = planR(recs, Rall, a.rBudget);
  const Rsample = Rall.filter((b) => rPlan.ids.has(b.rec));
  const S2sample = planS2(S2all, a.s2PerArm);
  const judgeR = Rsample.filter((b) => b.bundle);
  const blindPool = [...judgeR, ...S2sample].filter((_, i) => i % a.blindEvery === 0);

  console.log(`records ${recs.length} (valid ${recs.filter((r) => r.valid).length}); R dp-bundles all ${Rall.length} (judge-needed ${Rall.filter((b) => b.bundle).length}); S2 candidates ${S2all.length}`);
  console.log(`R sample: k=${rPlan.k} trials per cell per arm, records ${rPlan.ids.size}, dp-bundles ${Rsample.length}, Claude calls ${judgeR.length} (budget ${a.rBudget})`);
  console.log(`S2 sample: ${S2sample.length} (${a.s2PerArm} per arm) -> ${S2sample.length} Claude + ${2 * S2sample.length} open-model calls; arm-blindness calls ${a.blind ? blindPool.length : 0}`);
  const s2est = S2sample.map((b) => estimateTokens(SYSTEM + buildPrompt(b.bundle)));
  if (s2est.length) console.log(`S2 prompt tokens (estimated): max ${Math.max(...s2est)}, mean ${Math.round(s2est.reduce((s, x) => s + x, 0) / s2est.length)}, limit ${CTX_LIMIT * NUM_CTX}`);
  if (a.dry) {
    const r2 = judgeR.find((b) => b.item === 'R2') ?? judgeR[0];
    if (r2) console.log(`\n===== ${r2.id} ${r2.item}\n${buildPrompt(r2.bundle)}`);
    if (S2sample[0]) console.log(`\n===== ${S2sample[0].id}\n${buildPrompt(S2sample[0].bundle)}`);
    const r4 = judgeR.find((b) => b.item === 'R4');
    if (r4) console.log(`\n===== ${r4.id} ${r4.item}\n${buildPrompt(r4.bundle)}`);
    console.log('\n===== S2 claims (first 20 of the sample)');
    for (const b of S2sample.slice(0, 20)) console.log(`${b.arm} ${b.cell} [${b.cls}] ${b.bundle.spans.find((s) => s.id === 'C')?.text.slice(0, 160)}`);
    return;
  }
  if (a.plan) {
    const t = {};
    for (const b of Rsample) { const k = `${b.group}|${b.arm}|${b.item}`; const o = (t[k] ??= { all: 0, judge: 0, det: {} }); o.all++; if (b.bundle) o.judge++; else o.det[b.deterministic] = (o.det[b.deterministic] ?? 0) + 1; }
    for (const [k, v] of Object.entries(t).sort()) console.log(`  ${k}: ${v.all} bundles, judge ${v.judge}, deterministic ${JSON.stringify(v.det)}`);
    return;
  }

  // Raw answers: every exp32-E-cache*.json in the runs directory is read (jurors may run in
  // parallel from Windows and WSL into different files); new answers go to --cache.
  const cachePath = a.cache ? resolve(ROOT, a.cache) : rel(join(a.runs, 'exp32-E-cache.json'));
  const cache = new Map();
  for (const f of readdirSync(rel(a.runs)).filter((n) => /^exp32-E-cache.*\.json$/.test(n)).map((n) => rel(join(a.runs, n)))) {
    for (const [k, v] of Object.entries(JSON.parse(readFileSync(f, 'utf8')))) cache.set(k, v);
  }
  const own = new Map(existsSync(cachePath) ? Object.entries(JSON.parse(readFileSync(cachePath, 'utf8'))) : []);
  const save = () => { for (const [k, v] of cache) if (!own.has(k) && !knownAtStart.has(k)) own.set(k, v); writeFileSync(cachePath, JSON.stringify(Object.fromEntries(own), null, 1)); };
  const knownAtStart = new Set([...cache.keys()].filter((k) => !own.has(k)));
  const calls = { claude: 0, qwen: 0, granite: 0, blind: 0 };
  const progress = (name, total) => { let k = 0; const t0 = Date.now(); return (b, raw) => { k++; if (k % 10 === 0 || k === total) { save(); console.log(`  ${name} ${k}/${total} (${((Date.now() - t0) / 1000).toFixed(0)} s)`); } if (raw.error) console.log(`  ${name} error on ${b.id}: ${String(raw.error).slice(0, 160)}`); }; };
  for (const name of a.jurors) {
    if (!JURORS[name]) throw new Error(`unknown juror ${name}`);
    const bundles = name === 'claude' ? [...judgeR, ...S2sample] : S2sample;
    const uniq = [...new Map(bundles.map((b) => [b.bundle.hash, b.bundle])).values()];
    const c = { n: 0 };
    await runJuror(name, uniq, { cache, calls: c, onEach: progress(name, uniq.length) });
    calls[name] = c.n; save();
    console.log(`${name}: ${c.n} new calls`);
  }
  if (a.blind && a.jurors.includes('claude')) {
    for (const b of blindPool) {
      const key = `blind:${JURORS.claude.model}:${b.bundle.hash}`;
      if (cache.has(key)) continue;
      // The bundle without the decision-under-review line (it is the evaluator's text, not the agent's).
      const spans = b.bundle.spans.map((s) => (s.id === 'T' ? { ...s, text: s.text.replace(/\n\nDecision under review:[\s\S]*$/, '') } : s));
      const prompt = `${BLIND_Q}\n\n# Evidence bundle\n\n${renderBundle({ spans })}\n\n# Answer\nReturn the JSON object only.`;
      calls.blind++;
      let out = null, error = null;
      try { out = claudeJson({ system: BLIND_SYSTEM, prompt, schema: BLIND_SCHEMA, model: JURORS.claude.model }); } catch (e) { error = String(e.message ?? e).slice(0, 200); }
      cache.set(key, { out, error, juror: 'blind' });
      save();
    }
    console.log(`arm-blindness: ${calls.blind} new calls`);
  }

  // ------------------------------------------------------------- settle
  const rawOf = (name, b) => cache.get(`${name}:${JURORS[name].model}:${b.bundle.hash}`);
  const rows = [];
  for (const b of Rsample) {
    if (!b.bundle) { rows.push({ ...pub(b), deterministic: b.deterministic, verdict: 'not-met', judged: false }); continue; }
    const raw = rawOf('claude', b);
    const v = raw ? settle(b.bundle, raw) : { verdict: null, valid: false, invalid: 'not-run' };
    rows.push({ ...pub(b), hash: b.bundle.hash, judged: true, verdict: v.valid ? v.verdict : null, valid: v.valid, invalid: v.invalid ?? null, note: v.note ?? null, quotes: v.quotes ?? [], reasoning: String(v.reasoning ?? '').slice(0, 400) });
  }
  const s2rows = [];
  const names = Object.keys(JURORS);
  for (const b of S2sample) {
    const vs = names.map((n) => { const raw = rawOf(n, b); return raw ? { juror: n, ...settle(b.bundle, raw) } : { juror: n, verdict: null, valid: false, invalid: 'not-run' }; });
    const jury = majority(vs);
    s2rows.push({ ...pub(b), hash: b.bundle.hash, path: b.path, cls: b.cls, where: b.where, jury, jurors: vs.map((v) => ({ juror: v.juror, verdict: v.verdict, valid: v.valid, invalid: v.invalid ?? null, note: v.note ?? null, promptTokens: v.promptTokens ?? null, quotes: v.quotes ?? [], reasoning: String(v.reasoning ?? '').slice(0, 300) })) });
  }
  const blind = blindPool.map((b) => { const r = cache.get(`blind:${JURORS.claude.model}:${b.bundle.hash}`); return { id: b.id, item: b.item, arm: b.arm, truth: ARM_LETTER[b.arm], guess: r?.out?.setup ?? null, error: r?.error ?? null, reasoning: String(r?.out?.reasoning ?? '').slice(0, 200) }; });
  const blindAsked = blind.filter((x) => x.guess);
  const blindAcc = blindAsked.length ? blindAsked.filter((x) => x.guess === x.truth).length / blindAsked.length : null;

  // ------------------------------------------------------------- summary per group x arm
  const rate = (k, n) => (n ? Number((k / n).toFixed(3)) : null);
  const summary = {};
  for (const g of Object.keys(GROUPS)) for (const arm of ARMS) {
    const c = counts[`${g}|${arm}`] ?? { records: 0, invalid: 0 };
    const rr = rows.filter((x) => x.group === g && x.arm === arm);
    const items = {};
    for (const item of R_ITEMS) {
      const xs = rr.filter((x) => x.item === item);
      const judged = xs.filter((x) => x.judged);
      const det = {};
      for (const x of xs.filter((y) => !y.judged)) det[x.deterministic] = (det[x.deterministic] ?? 0) + 1;
      const met = judged.filter((x) => x.verdict === 'met').length, inv = judged.filter((x) => !x.valid).length;
      items[item] = { bundles: xs.length, deterministicNotMet: det, judged: judged.length, met, notMet: judged.filter((x) => x.verdict === 'not-met').length, invalid: inv, metRate: rate(met, xs.length), metRateAmongJudged: rate(met, judged.length), invalidRate: rate(inv, judged.length) };
    }
    const s2 = s2rows.filter((x) => x.group === g && x.arm === arm);
    const s2met = s2.filter((x) => x.jury.verdict === 'met').length;
    const perJuror = Object.fromEntries(names.map((n) => [n, { invalid: s2.filter((x) => !x.jurors.find((j) => j.juror === n).valid).length, met: s2.filter((x) => x.jurors.find((j) => j.juror === n).verdict === 'met').length }]));
    items.S2 = { candidates: S2all.filter((x) => x.group === g && x.arm === arm).length, sampled: s2.length, met: s2met, notMet: s2.filter((x) => x.jury.verdict === 'not-met').length, noMajority: s2.filter((x) => x.jury.noMajority).length, split: s2.filter((x) => x.jury.split).length, metRate: rate(s2met, s2.length), perJuror };
    (summary[g] ??= {})[arm] = { records: c.records, invalid: c.invalid, recordsSampledR: new Set(rr.map((x) => x.rec)).size, items };
  }

  const report = {
    header: {
      title: 'EXP-32 E series (rationale quality) scores',
      note: HEADER_NOTE,
      date: new Date().toISOString().slice(0, 10),
      runs: a.runs,
      decision: 'planning 23 §10 owner decision 2026-11-04: R2 / R4 / R5 judged by the light Claude model on the subscription (haiku), S2 by the jury (claude + qwen3:8b + granite3.3:8b, majority). Open models are not used for R2 / R4 / R5.',
      validation: 'experiments/judge/validation-2026-11-03.json (scripted set, met / not-met 3 each per item; only S2 passed the jury thresholds; Claude alone was 3/3 on every item)',
      registration: { dev: GROUPS.dev.points + ' (registered by the scorer after the run, minimal: fix location, test approach)', heldout: GROUPS.heldout.points, d3: GROUPS.d3.points, attribution: 'experiments/judge/exp32-decision-keywords.json (evaluator only)' },
      jurors: Object.fromEntries(names.map((n) => [n, JURORS[n]])),
      sampling: { R: { rule: 'first k valid trials per cell per arm, k largest that fits the Claude budget', k: rPlan.k, budget: a.rBudget, records: rPlan.ids.size, dpBundles: Rsample.length, judgeCalls: judgeR.length, deterministic: 'no-statement (no paragraph attributed to the decision point), fewer-than-2-options (R2), no-alternatives (R5) are not-met without a model call' }, S2: { rule: `per arm up to ${a.s2PerArm} candidates, round-robin over cells then records`, candidatesAll: S2all.length, sampled: S2sample.length } },
      // Per juror over the S2 sample: a juror with not-run > 0 did not finish (the cache resumes it).
      s2JurorCoverage: Object.fromEntries(names.map((n) => { const js = s2rows.map((x) => x.jurors.find((j) => j.juror === n)); const inv = {}; for (const j of js.filter((j) => !j.valid)) inv[j.invalid] = (inv[j.invalid] ?? 0) + 1; return [n, { valid: js.filter((j) => j.valid).length, invalid: inv }]; })),
      claudeCalls: { thisInvocation: { rItems: calls.claude, blind: calls.blind }, cachedTotal: { claude: [...cache.keys()].filter((k) => k.startsWith('claude:')).length, blind: [...cache.keys()].filter((k) => k.startsWith('blind:')).length }, openModel: { qwen: [...cache.keys()].filter((k) => k.startsWith('qwen:')).length, granite: [...cache.keys()].filter((k) => k.startsWith('granite:')).length } },
      limitations: [
        'Paragraph-to-decision-point attribution is by evaluator keywords; a decision written in other words counts as no-statement (not-met). Rates are therefore lower bounds and arms that write in a different register may be under-read.',
        'R2 option spans are extracted by list / marker heuristics; prose alternatives without markers are missed (fewer-than-2-options).',
        'S2 candidates are path citations whose sentence may describe the agent\'s own action rather than the file; such claims are judged not-met by construction.',
        'Claude (haiku) judging a Claude subject: self-preference risk remains (planning 23 §10). Validation set was 3 met / 3 not-met per item.',
        'Observations in a bundle are a window (issue body + up to 4 tool results sharing tokens with the paragraphs), not the whole trajectory; a decisive observation outside the window makes R4 not-met.',
      ],
    },
    summary,
    armBlindness: { asked: blindAsked.length, correct: blindAsked.filter((x) => x.guess === x.truth).length, accuracy: blindAcc, chance: 0.25, byArm: Object.fromEntries(ARMS.map((arm) => [arm, { n: blindAsked.filter((x) => x.arm === arm).length, correct: blindAsked.filter((x) => x.arm === arm && x.guess === x.truth).length }])), answers: blind },
    R: rows,
    S2: s2rows,
  };
  const outPath = rel(join(a.runs, 'exp32-E-scores.json'));
  writeFileSync(outPath, `${JSON.stringify(report, null, 1)}\n`);
  console.log(`\nwrote ${outPath}`);
  printSummary(summary, report.armBlindness, report.header.claudeCalls);
}

const pub = (b) => ({ id: b.id, rec: b.rec, group: b.group, cell: b.cell, arm: b.arm, trial: b.trial, dp: b.dp ?? null, category: b.category ?? null, item: b.item, options: b.options ?? null, paragraphs: b.paragraphs ?? null });

const pc = (x) => (x == null ? '-' : `${(100 * x).toFixed(0)}%`);
function printSummary(summary, blind, calls) {
  console.log('\n| group | arm | records (invalid) | R sample recs | R2 met | R4 met | R5 met | R invalid (judged) | S2 met (n) | S2 no-majority | S2 invalid claude/qwen/granite |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const [g, arms] of Object.entries(summary)) for (const [arm, s] of Object.entries(arms)) {
    const it = s.items;
    const judged = R_ITEMS.reduce((n, i) => n + it[i].judged, 0), inv = R_ITEMS.reduce((n, i) => n + it[i].invalid, 0);
    const pj = it.S2.perJuror;
    console.log(`| ${g} | ${arm} | ${s.records} (${s.invalid}) | ${s.recordsSampledR} | ${pc(it.R2.metRate)} (${it.R2.met}/${it.R2.bundles}) | ${pc(it.R4.metRate)} (${it.R4.met}/${it.R4.bundles}) | ${pc(it.R5.metRate)} (${it.R5.met}/${it.R5.bundles}) | ${inv}/${judged} | ${pc(it.S2.metRate)} (${it.S2.met}/${it.S2.sampled}) | ${it.S2.noMajority} | ${pj.claude.invalid}/${pj.qwen.invalid}/${pj.granite.invalid} |`);
  }
  console.log(`\narm-blindness: ${blind.correct}/${blind.asked} correct (${pc(blind.accuracy)}; chance 25%)`);
  console.log(`Claude calls cached: judge ${calls.cachedTotal.claude}, blind ${calls.cachedTotal.blind}; open-model calls: qwen ${calls.openModel.qwen}, granite ${calls.openModel.granite}`);
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('judge/score-runs.mjs')) main().catch((e) => { console.error(e); process.exit(1); });
