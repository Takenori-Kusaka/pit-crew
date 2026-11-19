// Format-independent extraction of a decision structure from free text, with deterministic
// after-checks (research-machine-only-rationale-evaluation §2.3 #11, §4 step 2). A local 8B
// model (ollama, schema-constrained JSON) reads the agent's text and returns options / polarity /
// arguments / adoption; the result is accepted only when
//   (1) every extracted field exists verbatim in the source (quote check),
//   (2) the counts are consistent (one adopted option; no empty option),
//   (3) two models of different lineages agree (disagreement = abstain),
// and the extractor itself is validated by FORMAT INVARIANCE: the same structure rendered as a
// table / bullets / prose / Japanese / English must extract to the same multiset (CheckList INV;
// the EXP-39/40 regex detectors failed exactly here). The rendering functions below produce those
// variants deterministically from a structure, so the test oracle is the structure itself.

import { OLLAMA_URL, NUM_CTX, estimateTokens } from './jurors.mjs';

export const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    decision: { type: 'string' },
    options: {
      type: 'array',
      items: {
        type: 'object',
        properties: { text: { type: 'string' }, adopted: { type: 'boolean' }, pros: { type: 'array', items: { type: 'string' } }, cons: { type: 'array', items: { type: 'string' } } },
        required: ['text', 'adopted', 'pros', 'cons'],
      },
    },
    trivial_claim: { type: 'boolean' },
    trivial_reason: { type: 'string' },
  },
  required: ['decision', 'options', 'trivial_claim'],
};

export const EXTRACT_SYSTEM = 'You extract the structure of a design decision from a developer\'s notes. Copy phrases VERBATIM from the text (do not paraphrase, do not translate). An option is a course of action the author considered; "adopted" is true for the one the author chose. Pros are reasons given for an option, cons reasons against it. If the author declared the decision trivial / obvious ("自明", "obvious", "only one way"), set trivial_claim true and copy the reason. If no decision structure is present, return an empty options list.';

export const buildExtractPrompt = (text) => `Text:\n<<<\n${text}\n>>>\n\nReturn the JSON.`;

// ------------------------------------------------------------------ after-checks
// Comparison form: letters and digits only (any script), lower-cased. Japanese spacing
// ("既存の round を直す" vs "既存のroundを直す"), markdown, table pipes and punctuation are not
// differences of content (validation 2026-11-05: every disagreement was of this kind).
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
// Option texts come back with rendering labels attached ("Option A (adopted): …", "案B（不採用）: …",
// "**案A**", or only the label). The label is not content: strip it before comparing.
const LABEL_RE = /^(?:\*\*)?(?:option|opt\.?|plan|選択肢|案|プラン)\s*[A-Za-zＡ-Ｚ0-9０-９一二三四五]+(?:\*\*)?\s*(?:[（(][^）)]*[）)])?\s*(?:is|=|[:：\-–—])?\s*/iu;
export const stripLabel = (t) => String(t ?? '').trim().replace(LABEL_RE, '').replace(/^["'“”「『]+|["'“”」』]+$/g, '').trim();

// Every extracted phrase must be in the source text (after whitespace / markup normalisation).
export function quoteCheck(text, out) {
  const src = norm(text);
  const missing = [];
  // The option text may carry a label and may be a whole sentence of the source: it must be in
  // the source after the label is stripped. Arguments must be verbatim.
  for (const o of out?.options ?? []) {
    const t = norm(stripLabel(o.text));
    if (t && !src.includes(t)) missing.push(o.text);
    // Arguments are checked piecewise (a joined list is verbatim piece by piece, not as a whole).
    for (const f of [...(o.pros ?? []), ...(o.cons ?? [])]) if (norm(f) && !splitArgs([f]).every((p) => src.includes(p))) missing.push(f);
  }
  if (out?.trivial_reason && !src.includes(norm(out.trivial_reason))) missing.push(out.trivial_reason);
  return { ok: missing.length === 0, missing };
}

export function countCheck(out) {
  const opts = out?.options ?? [];
  const problems = [];
  if (opts.some((o) => !norm(o.text))) problems.push('empty option text');
  const adopted = opts.filter((o) => o.adopted).length;
  if (opts.length && adopted !== 1) problems.push(`${adopted} adopted options`);
  if (out?.trivial_claim && opts.length >= 2) problems.push('trivial claim with two or more options');
  return { ok: problems.length === 0, problems };
}

// Canonical multiset form for agreement and invariance. An option is identified by what was
// said about it — adoption and the multisets of pros and cons — not by its label or wording
// (validation 2026-11-05: the lineages agreed on the arguments and the adoption in every case and
// differed only in how much of the label / sentence they copied into `text`). The trivial claim
// is part of the form; a trivial declaration may carry one pseudo-option.
// An argument list may come back joined ("one place; failures stay visible", "A / B", "A、B") or
// with a polarity label ("良い点: …", "pros: …"): for comparison each argument is split on list
// separators and the label is dropped. Display keeps the original strings.
const POLARITY_RE = /^\s*(?:pros?|cons?|良い点|悪い点|利点|欠点|長所|短所|メリット|デメリット)\s*[:：]\s*/iu;
export const splitArgs = (xs) => (xs ?? []).flatMap((a) => String(a ?? '').replace(POLARITY_RE, '').split(/\s*(?:;|\/|、|,|・|\n)\s*/)).map(norm).filter(Boolean);
export function canonical(out) {
  const trivial = !!out?.trivial_claim;
  const opts = trivial && (out?.options ?? []).length <= 1 ? [] : (out?.options ?? []).map((o) => ({ adopted: !!o.adopted, pros: splitArgs(o.pros).sort(), cons: splitArgs(o.cons).sort() }));
  opts.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return JSON.stringify({ options: opts, trivial });
}
// Display texts (label-stripped), for `mentioned` matching and reports; not part of equality.
export const optionTexts = (out) => (out?.options ?? []).map((o) => stripLabel(o.text));
export const agree = (a, b) => canonical(a) === canonical(b);

// Accept an extraction only when it passes both checks and two lineages agree.
export function settleExtraction(text, outs) {
  const valid = outs.filter((o) => o && quoteCheck(text, o).ok && countCheck(o).ok);
  if (valid.length < 2) return { status: 'abstain', reason: valid.length === 0 ? 'no valid extraction' : 'one valid extraction only', out: valid[0] ?? null };
  if (!agree(valid[0], valid[1])) return { status: 'abstain', reason: 'lineages disagree', out: null };
  return { status: 'ok', out: valid[0] };
}

// ------------------------------------------------------------------ renderings (test oracle)
// The same structure written as different documents. Used to validate the extractor (INV) and
// nowhere else: a rendering is never scored.
const label = (i, lang) => (lang === 'ja' ? `案${String.fromCharCode(65 + i)}` : `Option ${String.fromCharCode(65 + i)}`);
export function renderAs(s, form, lang = 'en') {
  const opts = s.options;
  const adoptedWord = lang === 'ja' ? '採用' : 'adopted';
  const rejectedWord = lang === 'ja' ? '不採用' : 'rejected';
  const pro = lang === 'ja' ? '良い点' : 'pros', con = lang === 'ja' ? '悪い点' : 'cons';
  if (form === 'table') {
    const head = lang === 'ja' ? '| 案 | 内容 | 良い点 | 悪い点 | 判定 |' : '| option | what | pros | cons | verdict |';
    const rows = opts.map((o, i) => `| ${label(i, lang)} | ${o.text} | ${o.pros.join('; ')} | ${o.cons.join('; ')} | ${o.adopted ? adoptedWord : rejectedWord} |`);
    return `${lang === 'ja' ? '## 判断の点: ' : '## Decision: '}${s.decision}\n\n${head}\n|---|---|---|---|---|\n${rows.join('\n')}\n`;
  }
  if (form === 'bullets') {
    return `${lang === 'ja' ? '判断の点: ' : 'Decision: '}${s.decision}\n\n${opts.map((o, i) => `- **${label(i, lang)}**（${o.adopted ? adoptedWord : rejectedWord}）: ${o.text}\n  - ${pro}: ${o.pros.join(' / ')}\n  - ${con}: ${o.cons.join(' / ')}`).join('\n')}\n`;
  }
  // prose
  const sent = opts.map((o, i) => (lang === 'ja'
    ? `${label(i, lang)}は「${o.text}」で、${o.pros.length ? `良い点は${o.pros.join('、')}` : '良い点は無い'}。${o.cons.length ? `悪い点は${o.cons.join('、')}` : '悪い点は無い'}。${o.adopted ? 'これを採用した' : 'これは採らなかった'}。`
    : `${label(i, lang)} is "${o.text}": ${o.pros.length ? `pros: ${o.pros.join(', ')}` : 'no pros'}; ${o.cons.length ? `cons: ${o.cons.join(', ')}` : 'no cons'}. ${o.adopted ? 'This was adopted.' : 'This was rejected.'}`));
  return `${lang === 'ja' ? '判断の点は' : 'The decision was'} ${s.decision}. ${sent.join(' ')}\n`;
}
export const RENDERINGS = [['table', 'en'], ['bullets', 'en'], ['prose', 'en'], ['table', 'ja'], ['bullets', 'ja'], ['prose', 'ja']];

// ------------------------------------------------------------------ targeted extraction
// Free extraction fails on real agent prose: two 8B lineages pick DIFFERENT things as "the
// decision" when the text has no explicit alternatives (2026-11-05, 0/9 agreement on EXP-32).
// Targeted extraction asks about the PLANTED options of one registered decision point: for each
// option, was it mentioned, did the author claim to adopt it, and which verbatim reasons were given
// for / against it. Adoption itself is decided from the final state (L0); the claim is a separate
// field. Lineages are compared on the skeleton (mentioned / claimed per option); reasons are kept
// per model and quote-checked.
export const TARGETED_SCHEMA = {
  type: 'object',
  properties: {
    // evidence: the verbatim span that refers to the course of action (2026-11-05 validation: without it,
    // llama3.1 marked an ABSENT option as mentioned in 18/30 renderings and qwen3 in 8/30; a mention
    // must be checkable like a reason).
    options: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, mentioned: { type: 'boolean' }, evidence: { type: 'string' }, claimed_adopted: { type: 'boolean' }, pros: { type: 'array', items: { type: 'string' } }, cons: { type: 'array', items: { type: 'string' } } }, required: ['id', 'mentioned', 'evidence', 'claimed_adopted', 'pros', 'cons'] } },
    other_options: { type: 'array', items: { type: 'string' } },
    trivial_claim: { type: 'boolean' },
    trivial_reason: { type: 'string' },
  },
  required: ['options', 'other_options', 'trivial_claim'],
};
export const TARGETED_SYSTEM = 'You read a developer\'s notes and answer, for each listed course of action, whether the notes mention it as something considered (mentioned), whether the notes say the author chose / will do it (claimed_adopted), and which reasons the notes give for it (pros) and against it (cons). Copy reasons VERBATIM from the notes (no paraphrase, no translation); if a reason is not in the notes, do not invent one. Mention is true only when the notes clearly refer to that course of action (not a loosely related remark); when mentioned is true, copy into evidence the shortest VERBATIM span of the notes that refers to it (empty string when not mentioned). List in other_options any further courses of action the notes consider that are not in the list. If the notes declare the decision trivial / obvious, set trivial_claim true and copy the reason.';
export const buildTargetedPrompt = (text, options) => `Courses of action:\n${options.map((o) => `[${o.id}] ${o.text}`).join('\n')}\n\nNotes:\n<<<\n${text}\n>>>\n\nReturn the JSON (one entry per listed id, in order).`;

export async function ollamaExtractTargeted(model, text, options, { numCtx = NUM_CTX, fetchImpl = fetch } = {}) {
  const prompt = buildTargetedPrompt(text, options);
  const body = { model, stream: false, think: false, format: TARGETED_SCHEMA, keep_alive: '10m', options: { temperature: 0, seed: 0, num_ctx: numCtx, num_predict: 1200 }, messages: [{ role: 'system', content: TARGETED_SYSTEM }, { role: 'user', content: prompt }] };
  const res = await fetchImpl(`${OLLAMA_URL}/api/chat`, { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`ollama ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  let out = null, error = null;
  try { out = JSON.parse(j.message?.content ?? ''); } catch { error = `unparsable: ${String(j.message?.content).slice(0, 200)}`; }
  return { out, error, promptTokens: j.prompt_eval_count ?? null, estTokens: estimateTokens(TARGETED_SYSTEM + prompt), numCtx };
}

// Checks: every listed id answered once; reasons verbatim (piecewise); at most one claimed adoption;
// a reason given for an option implies it was mentioned; a mention needs checkable evidence (a verbatim
// span in the notes, or at least one verified reason) — otherwise the output is invalid, not corrected.
export function targetedCheck(text, options, out, { requireEvidence = true } = {}) {
  const problems = [], missing = [];
  const ids = options.map((o) => o.id), got = (out?.options ?? []).map((o) => o.id);
  if (ids.some((i) => !got.includes(i)) || got.length !== ids.length) problems.push('ids not answered exactly once');
  const src = norm(text);
  for (const o of out?.options ?? []) {
    let verifiedReasons = 0;
    for (const f of [...(o.pros ?? []), ...(o.cons ?? [])]) { if (!norm(f)) continue; if (splitArgs([f]).every((p) => src.includes(p))) verifiedReasons++; else missing.push(f); }
    if (!o.mentioned && ((o.pros ?? []).length || (o.cons ?? []).length || o.claimed_adopted)) problems.push(`${o.id}: reasons or adoption without mention`);
    // A span shorter than 10 normalised characters (a single common word) is no evidence of a mention.
    const evidenceOk = norm(o.evidence).length >= 10 && src.includes(norm(o.evidence));
    // A decision-only lineage (Jev, `lineage: 'jev'`) answers with calibrated probabilities and quotes
    // nothing; its mentions are checked by agreement with the quoting lineage instead (owner 2026-11-05).
    if (requireEvidence && o.mentioned && !evidenceOk && verifiedReasons === 0) problems.push(`${o.id}: mention without verifiable evidence`);
  }
  if ((out?.options ?? []).filter((o) => o.claimed_adopted).length > 1) problems.push('more than one claimed adoption');
  if (out?.trivial_reason && !src.includes(norm(out.trivial_reason))) missing.push(out.trivial_reason);
  return { ok: problems.length === 0 && missing.length === 0, problems, missing };
}
// Skeleton for agreement: per id, mentioned and claimed; plus the trivial claim.
export const targetedSkeleton = (out) => JSON.stringify({ o: (out?.options ?? []).map((o) => [o.id, !!o.mentioned, !!o.claimed_adopted]).sort((a, b) => a[0].localeCompare(b[0])), t: !!out?.trivial_claim });
export function settleTargeted(text, options, outs) {
  const valid = outs.filter((o) => o && targetedCheck(text, options, o, { requireEvidence: o.lineage !== 'jev' }).ok);
  if (valid.length < 2) return { status: 'abstain', reason: valid.length === 0 ? 'no valid extraction' : 'one valid extraction only', out: null, valid };
  if (targetedSkeleton(valid[0]) !== targetedSkeleton(valid[1])) return { status: 'abstain', reason: 'lineages disagree on the skeleton', out: null, valid };
  // Agreed skeleton; reasons = union of the two models' verbatim reasons (both quote-checked).
  const merged = { ...valid[0], options: valid[0].options.map((o) => { const b = valid[1].options.find((x) => x.id === o.id) ?? { pros: [], cons: [] }; const u = (xs, ys) => { const seen = new Set(); return [...xs, ...ys].filter((s) => { const k = norm(s); if (!k || seen.has(k)) return false; seen.add(k); return true; }); }; return { ...o, pros: u(o.pros ?? [], b.pros ?? []), cons: u(o.cons ?? [], b.cons ?? []) }; }) };
  return { status: 'ok', out: merged, valid };
}
export async function extractTargetedBatch(models, items, { cache = {}, hash = (s) => s, onProgress = () => {}, callers = {}, ...opts } = {}) {
  // items: [{ text, options }] ; model-major; cache key = model : hash(text + option ids/texts)
  // callers[model] = async (text, options) => raw, for a lineage that is not an ollama model (Jev).
  const call = (m, it) => (callers[m] ? callers[m](it.text, it.options) : ollamaExtractTargeted(m, it.text, it.options, opts));
  const key = (m, it) => `${m}:T2:${hash(`${it.text}\u0000${JSON.stringify(it.options)}`)}`; // T2 = schema with evidence
  const uniq = []; const seen = new Set();
  for (const it of items) { const k = key('', it); if (!seen.has(k) && String(it.text ?? '').trim()) { seen.add(k); uniq.push(it); } }
  // Transport errors (ollama down / killed mid-run) are NOT persisted in the cache — only this run sees
  // them — so a rerun retries instead of inheriting a failure. Unparsable model output is a real answer and stays cached.
  const local = {};
  const raw = (k) => cache[k] ?? local[k];
  for (const m of models) { let i = 0; for (const it of uniq) { const k = key(m, it); if (!raw(k)) { const r = await call(m, it).catch((e) => ({ out: null, error: String(e.message ?? e) })); if (isTransportError(r)) local[k] = r; else cache[k] = r; onProgress(m, ++i, uniq.length); } } }
  const out = new Map();
  for (const it of uniq) out.set(key('', it), { ...settleTargeted(it.text, it.options, models.map((m) => raw(key(m, it))?.out ?? null)), raws: models.map((m) => raw(key(m, it))) });
  return { get: (it) => out.get(key('', it)) };
}

// ------------------------------------------------------------------ the model call (ollama)
export async function ollamaExtract(model, text, { numCtx = NUM_CTX, fetchImpl = fetch } = {}) {
  const prompt = buildExtractPrompt(text);
  const body = { model, stream: false, think: false, format: EXTRACT_SCHEMA, keep_alive: '10m', options: { temperature: 0, seed: 0, num_ctx: numCtx, num_predict: 1200 }, messages: [{ role: 'system', content: EXTRACT_SYSTEM }, { role: 'user', content: prompt }] };
  const res = await fetchImpl(`${OLLAMA_URL}/api/chat`, { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`ollama ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  let out = null, error = null;
  try { out = JSON.parse(j.message?.content ?? ''); } catch { error = `unparsable: ${String(j.message?.content).slice(0, 200)}`; }
  return { out, error, promptTokens: j.prompt_eval_count ?? null, estTokens: estimateTokens(EXTRACT_SYSTEM + prompt), numCtx };
}

// Two lineages (qwen3:8b and granite3.3:8b, as the jury), one text -> settled extraction.
// For one text only: alternating models per text reloads a 5 GB model every call on an 8 GiB GPU
// (2026-11-05: the EXP-39/40 regrade thrashed for 16 minutes). Batches use extractBatch.
export async function extractWith(models, text, opts = {}) {
  const raws = [];
  for (const m of models) raws.push(await ollamaExtract(m, text, opts).catch((e) => ({ out: null, error: String(e.message ?? e) })));
  return { ...settleExtraction(text, raws.map((r) => r.out)), raws };
}

// Model-major batch: every text with model 1, then every text with model 2 (one load per model),
// with a cache { `${model}:${hash}`: raw } so a rerun costs nothing. Returns Map text -> settled.
// A raw result that never reached a model answer (fetch failure, HTTP error) — never cached.
export const isTransportError = (r) => !!r && r.out == null && typeof r.error === 'string' && !/^unparsable/.test(r.error);
export async function extractBatch(models, texts, { cache = {}, hash = (s) => s, onProgress = () => {}, ...opts } = {}) {
  const uniq = [...new Set(texts.filter((t) => String(t ?? '').trim()))];
  const local = {};
  const raw = (k) => cache[k] ?? local[k];
  for (const m of models) {
    let i = 0;
    for (const t of uniq) {
      const key = `${m}:${hash(t)}`;
      if (!raw(key)) { const r = await ollamaExtract(m, t, opts).catch((e) => ({ out: null, error: String(e.message ?? e) })); if (isTransportError(r)) local[key] = r; else cache[key] = r; onProgress(m, ++i, uniq.length); }
    }
  }
  const out = new Map();
  for (const t of uniq) out.set(t, { ...settleExtraction(t, models.map((m) => raw(`${m}:${hash(t)}`)?.out ?? null)), raws: models.map((m) => raw(`${m}:${hash(t)}`)) });
  return out;
}
