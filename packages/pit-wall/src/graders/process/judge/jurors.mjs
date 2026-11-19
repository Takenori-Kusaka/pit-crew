// The jury (planning 23 §4, research §5.1 points 8-9): Claude on the subscription plus two
// open models of other lineages on the host (ollama, 127.0.0.1). Jurors run one model at a
// time over the whole batch, so the 8 GiB GPU loads each model once. A verdict is valid only
// if every quote exists verbatim in the bundle and (open models) the prompt fit the context.

import { claudeJson } from '../../../judge.mjs';
import { SCHEMA, SYSTEM, buildPrompt, postCheck } from './items.mjs';

export const OLLAMA_URL = process.env.PITWALL_OLLAMA_URL ?? 'http://127.0.0.1:11434';
export const NUM_CTX = 8192;
export const CTX_LIMIT = 0.8; // a prompt above 80 % of num_ctx may have been truncated (planning 23 §8)

export const JURORS = {
  claude: { kind: 'claude', model: process.env.PITWALL_JUDGE_MODEL ?? 'haiku' },
  qwen: { kind: 'ollama', model: 'qwen3:8b' },
  granite: { kind: 'ollama', model: 'granite3.3:8b' },
};

const ws = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
// A quote may be shortened with an ellipsis; every piece must be in the same span. Surrounding
// quote marks are not part of the quote.
const pieces = (q) => ws(q).replace(/^["'“”‘’「『]+|["'“”‘’」』]+$/g, '').split(/\s*(?:\.\.\.|…)\s*/).map((p) => p.trim()).filter(Boolean);

// Check the quotes against the bundle. Returns { ok, located: [{ span_id, text }], missing }.
// A quote filed under the wrong span id but present in another span is relocated (the item
// checks need to know where the quote really is); one present nowhere makes the verdict invalid.
export function checkQuotes(bundle, quotes) {
  const located = [], missing = [];
  for (const q of quotes ?? []) {
    const ps = pieces(q?.text);
    if (!ps.length) { missing.push(q); continue; }
    const inSpan = (s) => { const t = ws(s.text); return ps.every((p) => t.includes(p)); };
    const named = bundle.spans.find((s) => s.id === String(q.span_id ?? '').replace(/^\[|\]$/g, ''));
    const hit = named && inSpan(named) ? named : bundle.spans.find(inSpan);
    if (hit) located.push({ span_id: hit.id, text: q.text }); else missing.push(q);
  }
  return { ok: missing.length === 0, located, missing };
}

// Turn one raw juror answer into a checked verdict.
// raw: { out: {quotes, reasoning, verdict} | null, error?, promptTokens?, numCtx? }
export function settle(bundle, raw) {
  const r = { verdict: null, valid: false, invalid: null, quotes: raw.out?.quotes ?? [], reasoning: raw.out?.reasoning ?? '', promptTokens: raw.promptTokens ?? null, note: null };
  if (raw.error || !raw.out) return { ...r, invalid: 'error', note: String(raw.error ?? 'no output').slice(0, 300) };
  if (raw.numCtx && raw.promptTokens != null && raw.promptTokens > CTX_LIMIT * raw.numCtx) return { ...r, invalid: 'context-overflow', note: `${raw.promptTokens} prompt tokens > ${CTX_LIMIT} × ${raw.numCtx}` };
  if (raw.numCtx && raw.estTokens != null && raw.estTokens > CTX_LIMIT * raw.numCtx) return { ...r, invalid: 'context-overflow', note: `estimated ${raw.estTokens} tokens > ${CTX_LIMIT} × ${raw.numCtx}` };
  if (!['met', 'not-met'].includes(raw.out.verdict)) return { ...r, invalid: 'bad-verdict' };
  const qc = checkQuotes(bundle, raw.out.quotes);
  if (!qc.ok) return { ...r, invalid: 'quote-missing', note: `not in bundle: ${qc.missing.map((q) => JSON.stringify(String(q?.text ?? '').slice(0, 80))).join(', ')}` };
  if (raw.out.verdict === 'met' && qc.located.length === 0) return { ...r, invalid: 'met-without-quote' };
  const pc = postCheck(bundle, raw.out.verdict, qc.located);
  return { ...r, verdict: pc.verdict, valid: true, quotes: qc.located, note: pc.note };
}

// Majority vote over checked verdicts. A verdict needs more than half of all jurors (invalid
// ones count as abstentions, so 1 met + 1 not-met + 1 invalid has no majority). `split` is
// true whenever valid verdicts disagree: those go to a person (research §5.2 (c)).
export function majority(verdicts) {
  const n = verdicts.length;
  const met = verdicts.filter((v) => v.valid && v.verdict === 'met').length;
  const not = verdicts.filter((v) => v.valid && v.verdict === 'not-met').length;
  const verdict = met > n / 2 ? 'met' : not > n / 2 ? 'not-met' : null;
  return { verdict, met, notMet: not, invalid: n - met - not, split: met > 0 && not > 0, noMajority: verdict == null };
}

// Rough token estimate (a second guard: ollama reports fewer prompt tokens when it reuses its
// prompt cache). About 3.2 characters per token for English prose and code.
export const estimateTokens = (s) => Math.ceil(String(s).length / 3.2);

async function ollamaCall(model, prompt, { numCtx = NUM_CTX, fetchImpl = fetch } = {}) {
  const body = {
    model, stream: false, think: false, format: SCHEMA, keep_alive: '10m',
    options: { temperature: 0, seed: 0, num_ctx: numCtx, num_predict: 900 },
    messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }],
  };
  const res = await fetchImpl(`${OLLAMA_URL}/api/chat`, { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`ollama ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  let out = null, error = null;
  try { out = JSON.parse(j.message?.content ?? ''); } catch (e) { error = `unparsable: ${String(j.message?.content).slice(0, 200)}`; }
  return { out, error, promptTokens: j.prompt_eval_count ?? null, estTokens: estimateTokens(SYSTEM + prompt), numCtx, seconds: (j.total_duration ?? 0) / 1e9 };
}

function claudeCall(model, prompt) {
  const t = Date.now();
  try {
    const out = claudeJson({ system: SYSTEM, prompt, schema: SCHEMA, model });
    return { out, seconds: (Date.now() - t) / 1000 };
  } catch (e) {
    return { out: null, error: String(e.message ?? e), seconds: (Date.now() - t) / 1000 };
  }
}

// Run one juror over all bundles. `cache` (Map hash → raw) avoids asking the same juror the
// same bundle twice (a perturbation the normalisation removes gives an identical bundle; at
// temperature 0 the answer is the same input's answer). Returns Map bundle.hash → raw.
export async function runJuror(name, bundles, { cache = new Map(), onEach = () => {}, calls = { n: 0 } } = {}) {
  const j = JURORS[name];
  const out = new Map();
  for (const b of bundles) {
    const key = `${name}:${j.model}:${b.hash}`;
    if (!cache.has(key)) {
      const prompt = buildPrompt(b);
      calls.n++;
      const raw = j.kind === 'claude' ? claudeCall(j.model, prompt) : await ollamaCall(j.model, prompt).catch((e) => ({ out: null, error: String(e.message ?? e) }));
      cache.set(key, { ...raw, juror: name, model: j.model });
    }
    out.set(b.hash, cache.get(key));
    onEach(b, cache.get(key));
  }
  return out;
}
