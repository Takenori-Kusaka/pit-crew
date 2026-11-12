// Reader-model simulatability (research-machine-only §2.1 #3, §4 step 5; design 23 §3.3
// "communicable Δ"). A local 8B reader gets ONLY the rationale (adoption wording stripped) and the
// list of options with freshly shuffled labels, and must pick the option the rationale supports.
// communicable Δ = P(reader picks the adopted option | rationale) − P(reader picks it | no rationale).
// Controls that make the measure honest (Pruthi 2022; Poché 2026):
//   - no repository, no task text: the reader must not be able to solve the task itself
//   - labels are re-drawn per call, so a label cannot leak the mapping
//   - a degenerate rationale (the conclusion in one sentence) is a baseline that must not beat control
//   - the adopted option's description never says it was adopted (hideAdoption)
import { OLLAMA_URL, NUM_CTX, estimateTokens } from './jurors.mjs';
import { hideAdoption } from './bundle.mjs';

export const READER_SCHEMA = { type: 'object', properties: { choice: { type: 'string' }, confidence: { type: 'string', enum: ['low', 'medium', 'high'] } }, required: ['choice'] };
export const READER_SYSTEM = 'You read a developer\'s reasoning about a design decision. You do NOT know the task or the codebase. From the reasoning alone, pick the option the reasoning argues FOR. Answer with the option label only.';
const LABELS = ['P', 'Q', 'R', 'S', 'T', 'U'];

// Deterministic shuffle from a seed (reproducible per call).
export function shuffled(n, seed) {
  let s = seed >>> 0; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const idx = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}

// Build one reader prompt. options: [{ text }], adoptedIndex; rationale: string | null (null = control).
// Returns { prompt, labelOf: index -> label, adoptedLabel }.
export function buildReaderPrompt(options, adoptedIndex, rationale, seed) {
  const order = shuffled(options.length, seed);
  const labelOf = {}; order.forEach((optIdx, pos) => { labelOf[optIdx] = LABELS[pos]; });
  const list = order.map((optIdx) => `${labelOf[optIdx]}. ${hideAdoption(options[optIdx].text)}`).join('\n');
  const body = rationale == null ? 'No reasoning is available. Pick the option you would guess.' : `Reasoning:\n<<<\n${hideAdoption(rationale)}\n>>>`;
  return { prompt: `Options:\n${list}\n\n${body}\n\nWhich option does the reasoning argue for? Return JSON {"choice": "<label>"}.`, labelOf, adoptedLabel: labelOf[adoptedIndex] };
}

export function parseChoice(out, labelOf) {
  const c = String(out?.choice ?? '').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
  const idx = Object.entries(labelOf).find(([, l]) => l === c)?.[0];
  return idx == null ? null : Number(idx);
}

// Picks over k seeds -> rate of picking the adopted option.
export function pickRate(picks, adoptedIndex) {
  const valid = picks.filter((p) => p != null);
  return { rate: valid.length ? valid.filter((p) => p === adoptedIndex).length / valid.length : null, n: valid.length, invalid: picks.length - valid.length };
}

// communicable Δ for one decision point from the three rates; `chance` = 1 / options.
export function communicable({ withRationale, control, degenerate }, nOptions) {
  const chance = 1 / nOptions;
  return {
    delta: withRationale.rate == null || control.rate == null ? null : withRationale.rate - control.rate,
    aboveChance: withRationale.rate == null ? null : withRationale.rate > chance,
    degenerateBeatsControl: degenerate?.rate == null || control.rate == null ? null : degenerate.rate > control.rate,
  };
}

export async function ollamaRead(model, prompt, { numCtx = NUM_CTX, fetchImpl = fetch } = {}) {
  const body = { model, stream: false, think: false, format: READER_SCHEMA, keep_alive: '10m', options: { temperature: 0, seed: 0, num_ctx: numCtx, num_predict: 60 }, messages: [{ role: 'system', content: READER_SYSTEM }, { role: 'user', content: prompt }] };
  const res = await fetchImpl(`${OLLAMA_URL}/api/chat`, { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`ollama ${res.status}`);
  const j = await res.json();
  try { return { out: JSON.parse(j.message?.content ?? ''), estTokens: estimateTokens(prompt) }; } catch { return { out: null, error: 'unparsable' }; }
}

// Measure one decision point with one reader model: k label orders x {rationale, control, degenerate}.
export async function measurePoint(model, { options, adoptedIndex, rationale, degenerate = null }, { k = 6, seedBase = 20261105 } = {}) {
  const run = async (text) => {
    const picks = [];
    for (let i = 0; i < k; i++) {
      const { prompt, labelOf } = buildReaderPrompt(options, adoptedIndex, text, seedBase + i);
      const r = await ollamaRead(model, prompt).catch(() => ({ out: null }));
      picks.push(parseChoice(r.out, labelOf));
    }
    return pickRate(picks, adoptedIndex);
  };
  const withRationale = await run(rationale), control = await run(null), deg = degenerate ? await run(degenerate) : null;
  return { withRationale, control, degenerate: deg, ...communicable({ withRationale, control, degenerate: deg }, options.length) };
}
