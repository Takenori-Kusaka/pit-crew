// TypeSafe Jev (decision-only model: typed questions -> calibrated answers, no text generation) as
// (a) a reader of another lineage for communicable Δ (Choice over the options) and (b) an
// arbiter for split extractions (Noul). Trial use only (owner, 2026-11-05: "比較評価して、やっぱり不要
// という結論でもOK"). The key is read from TYPESAFE_API_KEY or ~/.config/pit-wall/typesafe-api-key,
// never logged or written. Only synthetic / cell material is sent (no secrets in cells by rule).
// API shape: POST https://api.typesafe.ai/v1/systemone { model, state, questions } ->
// { answers: { <id>: { type, noul|choice|score, ... } }, usage } (docs.typesafe.ai; research-typesafe.md §3).
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { hideAdoption } from './bundle.mjs';
import { shuffled } from './reader.mjs';

export const JEV_URL = process.env.TYPESAFE_API_URL ?? 'https://api.typesafe.ai/v1/systemone';
export const JEV_MODEL = process.env.TYPESAFE_MODEL ?? 'jev-latest';

export function apiKey() {
  if (process.env.TYPESAFE_API_KEY) return process.env.TYPESAFE_API_KEY.trim();
  const f = join(homedir(), '.config', 'pit-wall', 'typesafe-api-key');
  // The placeholder written by mk-key-placeholder.sh ("PASTE_…") counts as no key.
  if (existsSync(f)) { const k = readFileSync(f, 'utf8').trim(); return k && !k.startsWith('PASTE_') ? k : null; }
  return null;
}

// One System One request. Returns { answers, usage } or throws. Never echoes the key.
export async function systemOne(state, questions, { fetchImpl = fetch, model = JEV_MODEL } = {}) {
  const key = apiKey();
  if (!key) throw new Error('no TypeSafe API key (TYPESAFE_API_KEY or ~/.config/pit-wall/typesafe-api-key)');
  const res = await fetchImpl(JEV_URL, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, body: JSON.stringify({ model, state, questions }) });
  if (!res.ok) throw new Error(`typesafe ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// Reader question (Choice): which option does the reasoning argue for? Labels are shuffled per
// call exactly as for the local reader, so the two readers are compared on the same footing.
export function readerQuestion(options, adoptedIndex, rationale, seed) {
  const order = shuffled(options.length, seed);
  const labels = ['P', 'Q', 'R', 'S', 'T', 'U'];
  const labelOf = {}; order.forEach((optIdx, pos) => { labelOf[optIdx] = labels[pos]; });
  const choices = order.map((optIdx) => `${labelOf[optIdx]}: ${hideAdoption(options[optIdx].text)}`);
  const state = { reasoning: rationale == null ? '(no reasoning available)' : hideAdoption(rationale), options: choices };
  // Choice requires `criteria` (one entry per choice; API 422 "Field required" on 2026-11-05 probe).
  const criteria = {}; for (const optIdx of order) criteria[labelOf[optIdx]] = `The reasoning argues for the course of action labelled ${labelOf[optIdx]}`;
  const questions = { pick: { type: 'choice', instructions: 'From the reasoning alone, which option does the author argue FOR? If no reasoning is available, pick the option you would guess.', choices: order.map((optIdx) => labelOf[optIdx]), criteria } };
  return { state, questions, labelOf, adoptedLabel: labelOf[adoptedIndex] };
}
// Measure one decision point with Jev as the reader (owner 2026-11-05: Jev is the primary reader;
// the local 8B is the sign cross-check on a sample). Jev returns a probability per label, so one call
// per label order gives P(adopted) directly; k orders average out label-position bias.
// Same three texts as reader.mjs/measurePoint: rationale, control (none), degenerate (conclusion only).
export async function measurePointJev({ options, adoptedIndex, rationale, degenerate = null }, { k = 4, seedBase = 20261105, fetchImpl = fetch } = {}) {
  let inputTokens = 0, errors = 0;
  const run = async (text) => {
    const probs = [];
    for (let i = 0; i < k; i++) {
      const { state, questions, labelOf, adoptedLabel } = readerQuestion(options, adoptedIndex, text, seedBase + i);
      const r = await systemOne(state, questions, { fetchImpl }).catch(() => { errors++; return null; });
      if (!r) continue;
      inputTokens += r.usage?.input_tokens ?? 0;
      const p = r.answers?.pick?.probabilities?.[adoptedLabel];
      if (typeof p === 'number') probs.push(p); else if (r.answers) probs.push(pickFromAnswer(r.answers, labelOf) === adoptedIndex ? 1 : 0);
    }
    return { rate: probs.length ? probs.reduce((s, x) => s + x, 0) / probs.length : null, n: probs.length, invalid: k - probs.length };
  };
  const withRationale = await run(rationale), control = await run(null), deg = degenerate ? await run(degenerate) : null;
  const chance = 1 / options.length;
  return {
    withRationale, control, degenerate: deg, inputTokens, errors,
    delta: withRationale.rate == null || control.rate == null ? null : withRationale.rate - control.rate,
    aboveChance: withRationale.rate == null ? null : withRationale.rate > chance,
    degenerateBeatsControl: deg?.rate == null || control.rate == null ? null : deg.rate > control.rate,
  };
}

// P(adopted | text, options) with Jev over k label orders (probability per call, averaged).
export async function jevPickRate(options, adoptedIndex, text, { k = 4, seedBase = 20261105, fetchImpl = fetch } = {}) {
  const probs = []; let inputTokens = 0, errors = 0;
  for (let i = 0; i < k; i++) {
    const { state, questions, labelOf, adoptedLabel } = readerQuestion(options, adoptedIndex, text, seedBase + i);
    const r = await systemOne(state, questions, { fetchImpl }).catch(() => { errors++; return null; });
    if (!r) continue;
    inputTokens += r.usage?.input_tokens ?? 0;
    const p = r.answers?.pick?.probabilities?.[adoptedLabel];
    if (typeof p === 'number') probs.push(p); else if (r.answers) probs.push(pickFromAnswer(r.answers, labelOf) === adoptedIndex ? 1 : 0);
  }
  return { rate: probs.length ? probs.reduce((s, x) => s + x, 0) / probs.length : null, n: probs.length, invalid: k - probs.length, inputTokens, errors };
}

// Third-edition reader measure (design 23 §13, owner 2026-11-05 深夜). All texts are MASKED by the
// caller (mask.mjs): rationale (P_r), control rationale = another text with the task's vocabulary but
// not this point's reasons (P_x), degenerate = the adopted option's wording (P_d); P_0 = no text.
//   S = P_r − P_x (communicable), L1 = P_d − P_0 (leak left after masking; k = 1[L1 > tau]),
//   L2 = P_x − P_0 (the reader solving the task from vocabulary). shared = { P_0, P_d } may be passed
// in to reuse across arms (they depend only on the options).
// P_0 is measured on a content-free masked stub ("[案]."), not on "no reasoning": the reader keeps
// its wording prior with no text but drifts toward uniform with any text, so only the stub is on the
// same footing as the masked rationale (synthetic run 2, 2026-11-06).
export async function measurePointJevV3({ options, adoptedIndex, rationale, controlRationale, degenerate, nullText = '[案].' }, { k = 4, tau = 0.15, shared = null, fetchImpl = fetch } = {}) {
  const rate = (t) => jevPickRate(options, adoptedIndex, t, { k, fetchImpl });
  const r = await rate(rationale), x = await rate(controlRationale);
  const zero = shared?.P_0 ?? await rate(nullText), d = shared?.P_d ?? await rate(degenerate);
  const P = { P_r: r.rate, P_x: x.rate, P_0: zero.rate, P_d: d.rate };
  const num = (a, b) => (a == null || b == null ? null : a - b);
  const S = num(P.P_r, P.P_x), L1 = num(P.P_d, P.P_0), L2 = num(P.P_x, P.P_0);
  return { ...P, S, L1, L2, k: L1 == null ? null : L1 > tau ? 1 : 0, tau, inputTokens: (r.inputTokens ?? 0) + (x.inputTokens ?? 0) + (shared?.P_0 ? 0 : zero.inputTokens ?? 0) + (shared?.P_d ? 0 : d.inputTokens ?? 0), errors: (r.errors ?? 0) + (x.errors ?? 0) + (zero.errors ?? 0) + (d.errors ?? 0), shared: { P_0: zero, P_d: d } };
}

export const pickFromAnswer = (answers, labelOf) => { const c = String(answers?.pick?.choice ?? '').trim().toUpperCase(); const idx = Object.entries(labelOf).find(([, l]) => l === c)?.[0]; return idx == null ? null : Number(idx); };

// Skeleton lineage (owner 2026-11-05: "qwen + Jev の骨格一致"): per planted option, Noul "mentioned?" /
// "adopted?", plus one point-level Noul "declared trivial?". Returns a targeted-extraction-shaped raw
// { out, error, inputTokens } with no reasons and no evidence (`lineage: 'jev'` tells the checks so).
// Threshold 0.7: on the synthetic oracle 60/60 skeletons (0.5 → 59/60), validate-jev-arbiter-synthetic.
export const JEV_SKELETON_THRESHOLD = 0.7;
export async function jevSkeleton(text, options, { threshold = JEV_SKELETON_THRESHOLD, fetchImpl = fetch } = {}) {
  let inputTokens = 0;
  const outOptions = [];
  for (const o of options) {
    const { state, questions } = arbitrationQuestions(text, o.text);
    const r = await systemOne(state, questions, { fetchImpl });
    inputTokens += r.usage?.input_tokens ?? 0;
    const pm = r.answers?.mentioned?.noul, pa = r.answers?.adopted?.noul;
    if (typeof pm !== 'number' || typeof pa !== 'number') throw new Error(`jev: unexpected answer shape ${JSON.stringify(r.answers).slice(0, 120)}`);
    const mentioned = pm >= threshold;
    outOptions.push({ id: o.id, mentioned, evidence: '', claimed_adopted: mentioned && pa >= threshold, pros: [], cons: [], p: { mentioned: pm, adopted: pa } });
  }
  const t = await systemOne({ text }, trivialQuestion(), { fetchImpl });
  inputTokens += t.usage?.input_tokens ?? 0;
  const pt = t.answers?.trivial?.noul;
  // More than one option over the adoption threshold: keep only the most probable (the check rejects two).
  const adopted = outOptions.filter((o) => o.claimed_adopted);
  if (adopted.length > 1) { const best = adopted.reduce((a, b) => (b.p.adopted > a.p.adopted ? b : a)); for (const o of adopted) o.claimed_adopted = o === best; }
  return { out: { lineage: 'jev', options: outOptions, other_options: [], trivial_claim: typeof pt === 'number' ? pt >= threshold : false, p: { trivial: pt ?? null } }, error: null, inputTokens };
}
export const trivialQuestion = () => ({ trivial: { type: 'noul', instructions: 'Does the text declare the decision trivial, obvious, or not worth weighing alternatives?', criteria: { true: 'The author says the choice is obvious / trivial / needs no comparison', false: 'No such declaration (alternatives are weighed, or nothing is said about it)' } } });

// Arbitration question (Noul): does the text present `option` as rejected / adopted?
export function arbitrationQuestions(text, optionText) {
  return {
    state: { text, option: optionText },
    questions: {
      mentioned: { type: 'noul', instructions: 'Does the text present `option` as one of the courses of action the author considered?', criteria: { true: 'The option (or a clear paraphrase) appears as something considered, adopted or rejected', false: 'The option does not appear, or appears only as an unrelated remark' } },
      adopted: { type: 'noul', instructions: 'Does the text say the author CHOSE `option`?', criteria: { true: 'The author states this option was adopted, chosen or will be done', false: 'The option is rejected, or not chosen, or not mentioned' } },
    },
  };
}
