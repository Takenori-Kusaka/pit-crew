#!/usr/bin/env node
// EXP-48 §12.4 correspondence table, second lineage (Jev). Typed Noul questions:
//   B: one request per (item, requirement): "does satisfying this requirement amount to the item's
//      highest-level behaviour?"
//   C: one request per (item, chunk of skill lines): "does this excerpt contain an instruction that,
//      if followed, amounts to the behaviour?" (chunk = consecutive lines of one SKILL.md, <= ~1,500 chars)
// The behaviour texts are written from plan §5 (commit ea6ce946c) by the correspondence-table role
// before any answer is seen. Only the requirement / skill text and the behaviour are sent (no trial
// material). Amounts go to gates/exp48/jev-ledger.json; the key is never printed.
//   node experiments/exp48/arm-b-correspondence-jev.mjs --dry-run     estimate only, nothing sent
//   node experiments/exp48/arm-b-correspondence-jev.mjs --calibrate   4 requests (known yes/no pairs)
//   node experiments/exp48/arm-b-correspondence-jev.mjs               all requests (cap 0.10 USD for this step)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'; // EXP-48 correspondence
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { systemOne } from '../../packages/pit-wall/src/graders/process/judge/jev.mjs';
import { charge, readLedger, reserve, estimateTokens, usd, REQUEST_OVERHEAD_TOKENS, verdict } from '../../packages/pit-wall/src/graders/process/judge/jev-audit.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const ledger = join(root, 'gates/exp48/jev-ledger.json');
const out = join(root, 'experiments/exp48/arm-b-correspondence-jev.json');
const STEP_CAP_USD = 0.10;
const args = process.argv.slice(2);
const dry = args.includes('--dry-run'), calibrate = args.includes('--calibrate'), bChunks = args.includes('--b-chunks');

export const BEHAVIOUR = {
  R1: 'Before its first edit to the implementation file(s) it changes, the agent opens and reads the content of every implementation file it changes.',
  R2: 'Before its first edit to the implementation, the agent opens and reads the content of the files that import (call) the changed function or symbol: at least five such caller files, or all of them if there are fewer.',
  R3: 'Before its first edit to the implementation, the agent runs a search over the source files (grep, rg, git grep, or find by name).',
  R4: 'Before its first edit to the implementation, the agent runs git log, git blame or git show to check the history of the code it changes.',
  R5: 'Before making any implementation edit, the agent runs a test related to the change (or a reproduction script) and observes it FAIL, in a separate, earlier tool call (it observes the failure first).',
  W1: 'The agent writes or edits a test file BEFORE it first edits the implementation file.',
  W2: 'The agent runs a test it newly wrote and sees it FAIL on a source tree that does not yet contain the implementation change, in a tool call before the implementation edit.',
  E1: 'After its LAST source edit, the agent runs the tests that cover the changed implementation file(s) on that final tree, and all of them pass.',
  E2: 'After its LAST source edit, the agent runs the linter (biome check or eslint) over all the changed source files on that final tree, and it exits with code 0.',
};
const CONTEXT = 'An AI coding agent fixes a bug in a TypeScript repository (unit tests with vitest, lint with biome). The texts quoted are written in Japanese.';

function bQuestion(item, req) {
  return {
    state: { context: CONTEXT, behaviour: BEHAVIOUR[item], requirement: req.text },
    questions: { amounts: { type: 'noul', instructions: 'Suppose the agent fully satisfies `requirement` (whenever its conditions apply to a bug fix). Does satisfying it, by itself, amount to the agent performing `behaviour` as described (including its ordering and completeness conditions)?', criteria: { true: 'The requirement directly demands this behaviour or something that necessarily includes it', false: 'The requirement does not demand it, or demands only a weaker or partial form of it, or is about something else' } } },
  };
}
function cQuestion(item, chunk) {
  return {
    state: { context: CONTEXT, behaviour: BEHAVIOUR[item], excerpt: chunk.text },
    questions: { contains: { type: 'noul', instructions: 'The excerpt is part of a skill (instructions) the agent follows. Does the excerpt contain an instruction which, if followed (whenever its conditions apply to a bug fix), by itself amounts to the agent performing `behaviour` as described (including its ordering and completeness conditions)?', criteria: { true: 'Some instruction in the excerpt directly demands this behaviour or something that necessarily includes it', false: 'No instruction in the excerpt demands it, or only a weaker or partial form of it' } } },
  };
}

function chunksOfC() {
  const dir = join(root, 'subjects/dev-skill-default/skills');
  const chunks = [];
  for (const d of readdirSync(dir).sort()) {
    const rel = `${d}/SKILL.md`;
    const lines = readFileSync(join(dir, rel), 'utf8').split('\n');
    let start = null, buf = [];
    const flush = (end) => { if (buf.length) chunks.push({ ref: `${rel}:${start}-${end}`, text: buf.map((l, i) => `${start + i}: ${l}`).join('\n') }); buf = []; start = null; };
    let fm = 0;
    lines.forEach((l, i) => {
      const n = i + 1;
      if (fm < 2) { if (l.trim() === '---') fm++; return; } // skip frontmatter
      if (start == null) start = n;
      buf.push(l);
      if (buf.join('\n').length > 1500) flush(n);
    });
    flush(lines.length);
  }
  return chunks.filter((c) => c.text.replace(/^\d+: /gm, '').trim().length > 0);
}

const reqs = JSON.parse(readFileSync(join(root, 'experiments/exp48/arm-b-requirements-trace.json'), 'utf8')).requirements;
const chunks = chunksOfC();
let jobs = [];
for (const item of Object.keys(BEHAVIOUR)) {
  for (const r of reqs) jobs.push({ side: 'B', item, ref: r.id, ...bQuestion(item, r) });
  for (const c of chunks) jobs.push({ side: 'C', item, ref: c.ref, ...cQuestion(item, c) });
}
if (bChunks) {
  // Sensitivity (same granularity as C, written after the per-pair run): B requirements in
  // consecutive groups of <= ~1,500 chars, asked with the C question. Not the primary answer.
  const groups = []; let buf = [];
  const flushB = () => { if (buf.length) groups.push({ ref: `${buf[0].id}-${buf.at(-1).id}`, text: buf.map((r) => `${r.id}: ${r.text}`).join('\n') }); buf = []; };
  for (const r of reqs) { buf.push(r); if (buf.map((x) => x.text).join('').length > 1500) flushB(); }
  flushB();
  jobs = [];
  for (const item of Object.keys(BEHAVIOUR)) for (const g of groups) jobs.push({ side: 'Bchunk', item, ref: g.ref, ...cQuestion(item, g) });
}
if (calibrate) {
  const pick = [['B', 'R2', 'R017'], ['B', 'R2', 'R001'], ['B', 'E2', 'R156'], ['B', 'W1', 'R185']];
  jobs = pick.map(([s, i, r]) => jobs.find((j) => j.side === s && j.item === i && j.ref === r));
}
const est = (j) => estimateTokens(JSON.stringify(j.state)) + estimateTokens(JSON.stringify(j.questions)) + REQUEST_OVERHEAD_TOKENS;
const estTokens = jobs.reduce((s, j) => s + est(j), 0);
const summary = { requests: jobs.length, B: jobs.filter((j) => j.side === 'B').length, C: jobs.filter((j) => j.side === 'C').length, c_chunks: chunks.length, est_input_tokens: estTokens, est_usd: Number(usd(estTokens).toFixed(5)), ledger_total_usd: readLedger(ledger).total_usd, step_cap_usd: STEP_CAP_USD };
process.stdout.write(`${JSON.stringify(summary)}\n`);
if (dry) process.exit(0);
if (usd(estTokens) > STEP_CAP_USD) { process.stdout.write('estimate over the step cap: not sent\n'); process.exit(2); }
reserve(ledger, estTokens, 'exp48 arm-b correspondence (§12.4)');

const results = []; let inputTokens = 0, errors = 0;
const CONC = 6; let next = 0;
async function worker() {
  while (next < jobs.length) {
    const j = jobs[next++];
    try {
      const r = await systemOne(j.state, j.questions);
      inputTokens += r.usage?.input_tokens ?? 0;
      const a = Object.values(r.answers ?? {})[0];
      const p = typeof a?.noul === 'number' ? a.noul : null;
      results.push({ side: j.side, item: j.item, ref: j.ref, p, verdict: verdict(p) });
    } catch (e) { errors++; results.push({ side: j.side, item: j.item, ref: j.ref, p: null, verdict: null, error: String(e.message).slice(0, 120) }); }
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
const l = charge(ledger, { purpose: `exp48 arm-b correspondence (§12.4)${calibrate ? ' calibration' : ''}`, requests: jobs.length, inputTokens: inputTokens || estTokens, estimated: !inputTokens });
const file = calibrate ? out.replace('.json', '.calibration.json') : bChunks ? out.replace('.json', '.b-chunks.json') : out;
writeFileSync(file, `${JSON.stringify({ summary: { ...summary, billed_input_tokens: inputTokens, billed_usd: Number(usd(inputTokens).toFixed(6)), errors, ledger_total_after: l.total_usd }, behaviour: BEHAVIOUR, context: CONTEXT, results }, null, 1)}\n`);
process.stdout.write(`${JSON.stringify({ billed_input_tokens: inputTokens, usd: Number(usd(inputTokens).toFixed(6)), errors, ledger_total_after: l.total_usd, file })}\n`);
