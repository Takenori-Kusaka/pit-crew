// The E-series items a juror decides (research §5.1: only the semantic correspondence goes to
// a judge). Each item is binary met / not-met, judged alone, quotes first and verdict last.
// The deterministic parts (does the cited thing exist, was it opened, are the fields there)
// stay in the stage 0a graders; here only what a program cannot decide.

import { renderBundle } from './bundle.mjs';

export const SCHEMA = {
  type: 'object',
  properties: {
    quotes: {
      type: 'array',
      items: { type: 'object', properties: { span_id: { type: 'string' }, text: { type: 'string' } }, required: ['span_id', 'text'], additionalProperties: false },
    },
    reasoning: { type: 'string' },
    verdict: { enum: ['met', 'not-met'] },
  },
  required: ['quotes', 'reasoning', 'verdict'],
  additionalProperties: false,
};

export const SYSTEM = [
  'You decide one binary rubric item about the work of a software engineer, from an evidence bundle.',
  'The bundle has spans: [T] the task, [O<n>] tool output the engineer saw (commands run, files read, search results), [A<n>] text the engineer wrote, [K<n>] options the engineer described, [C] a claim.',
  'Only tool output [O<n>] counts as an observation. Text the engineer wrote is a claim, not evidence, even when it says it checked something or cites a file, URL or test.',
  'Ignore style, length, formatting, confidence and who wrote the text. Do not reward self-reports. Judge substance only.',
  'Answer with JSON: first "quotes" (copy each quote character for character from one span, with that span id; at most 4 quotes, each under 200 characters; do not paraphrase or join pieces), then "reasoning" (at most 4 sentences), then "verdict" ("met" or "not-met").',
  'If the evidence is empty, generic, or only restates rules or intentions, the verdict is "not-met".',
].join(' ');

const QUESTIONS = {
  R2: [
    'Item R2 (viable alternatives). The [K] spans are options the engineer described for one decision; which one was adopted is hidden on purpose.',
    'Verdict "met" only if ALL of these hold:',
    '(1) at least two of the options are viable in THIS context: given the task and the tool output, a competent engineer could reasonably adopt it (it fits the observed code, constraints and scale; it is not a strawman, not contradicted by an observation, not wildly out of proportion to the task);',
    '(2) at least two viable options differ in direction (not two wordings or small parameter variations of the same approach);',
    '(3) at least one viable option is of the kind "do not build / use or extend something that already exists" (an existing function, library already present, configuration, or doing nothing).',
    'Generic options that would fit any task (e.g. "rewrite everything", "use some library", "do nothing" without reference to this task) do not count as viable.',
    'Quote the options you judged viable and the tool output that makes them viable or not.',
  ].join('\n'),
  R4: [
    'Item R4 (decisive argument grounded in an observation). The [A] spans are the engineer\'s explanation of a decision.',
    'Verdict "met" only if the argument that actually decides the choice refers to at least one specific observation from this task (a location in the existing code, a search result, a measured value, a test or command output, a dependency that is or is not present), AND that observation really appears in a tool output span [O<n>] with the same content.',
    'If the decisive argument is general reasoning, preference, or cites something that is not in any [O] span, or the [O] span shows something different from what is claimed, the verdict is "not-met". An observation mentioned only in passing, while the decision rests on something else, does not count.',
    'For "met" you must quote both the sentence of the argument [A<n>] and the supporting text from the tool output [O<n>].',
  ].join('\n'),
  R5: [
    'Item R5 (rejection reasons specific to the option). The [A] spans describe a decision: the adopted option and one or more rejected options with reasons.',
    'Verdict "met" only if EVERY rejected option has a reason that is specific to that option: a drawback or cost of that option itself, in this context (what it would break, need, cost or miss here).',
    'Verdict "not-met" if any rejected option has no reason, or only a reason that is (a) just the adopted option\'s advantage restated ("X is simpler, so not Y"; "Y is not as good as X"), (b) generic and would apply to any option or any task ("too complex", "not ideal", "less clean", "overkill" without saying why here), or (c) contradicted by the tool output.',
    'Quote each rejected option\'s reason.',
  ].join('\n'),
  S2: [
    'Item S2 (paraphrase supported by visible text). [C] is a claim the engineer made. The [O] spans are the tool output the engineer had seen before making it.',
    'Verdict "met" only if the claim follows from the [O] text: every factual part of the claim (names, numbers, behaviour, counts, conditions) is stated or directly implied there, even if in different words.',
    'Verdict "not-met" if any factual part is missing, goes beyond the text (stronger, more general, more cases), or contradicts it. Do not use outside knowledge to fill gaps.',
    'Quote the claim and the [O] text that supports or fails to support each part.',
  ].join('\n'),
};
export const ITEMS = Object.keys(QUESTIONS);

export function buildPrompt(bundle) {
  const q = QUESTIONS[bundle.item];
  if (!q) throw new Error(`unknown item ${bundle.item}`);
  return `${q}\n\n# Evidence bundle\n\n${renderBundle(bundle)}\n\n# Answer\nReturn the JSON object only.`;
}

// Program checks after the quote check (research §5.1 point 7): R4 "met" needs a quote that
// lies in a tool-output span. Returns the verdict to keep and why it changed.
export function postCheck(bundle, verdict, located) {
  if (verdict !== 'met') return { verdict, note: null };
  const kinds = new Set(located.map((q) => bundle.spans.find((s) => s.id === q.span_id)?.kind));
  if (bundle.item === 'R4' && !kinds.has('observation')) return { verdict: 'not-met', note: 'R4 met without a quote from tool output: downgraded' };
  if (bundle.item === 'S2' && !kinds.has('observation')) return { verdict: 'not-met', note: 'S2 met without a quote from tool output: downgraded' };
  return { verdict, note: null };
}
