// Validate the format-independent extractor without labels (research-machine-only §4 step 2):
// synthetic decision structures are rendered as table / bullets / prose in English and Japanese;
// each rendering is extracted by two lineages (qwen3:8b, granite3.3:8b); the extractor passes when
// (a) every rendering of a structure yields the same canonical multiset as the structure itself
// (format invariance), (b) the two lineages agree, (c) a "trivial" rendering is read as trivial.
// Needs ollama on the host (not while Harbor runs: the GPU is shared).
//
// Usage: node experiments/judge/validate-extract.mjs [--out experiments/judge/validate-extract-<date>.json]
import { writeFileSync } from 'node:fs';
import { RENDERINGS, renderAs, canonical, ollamaExtract, settleExtraction, quoteCheck } from '../../packages/pit-wall/src/graders/process/judge/extract.mjs';

// --models=a,b: the two lineages to validate (default: the jury's). 2026-11-05: granite paraphrases
// real agent prose (quote check fails 195/228), so other second lineages are tried here first.
const MODELS = (process.argv.find((a) => a.startsWith('--models='))?.slice(9) ?? 'qwen3:8b,granite3.3:8b').split(',');
const out = process.argv.find((a) => a.startsWith('--out='))?.slice(6) ?? `experiments/judge/validate-extract-${new Date().toISOString().slice(0, 10)}.json`;

import { STRUCTURES, TRIVIAL } from './synthetic-structures.mjs';
const rows = [];
let invariant = 0, total = 0, agreeN = 0, trivialOk = 0;
for (const s of STRUCTURES) {
  const want = canonical({ options: s.options, trivial_claim: false });
  for (const [form, lang] of RENDERINGS) {
    const text = renderAs(s, form, lang);
    const raws = [];
    for (const m of MODELS) raws.push(await ollamaExtract(m, text).catch((e) => ({ out: null, error: String(e.message ?? e) })));
    const settled = settleExtraction(text, raws.map((r) => r.out));
    const got = settled.out ? canonical(settled.out) : null;
    const inv = got === want;
    total++; if (inv) invariant++; if (settled.status === 'ok') agreeN++;
    // Raw outputs are kept: the structures are synthetic, so reading them to find the failure
    // modes of the extractor leaks nothing about the cells.
    rows.push({ id: s.id, form, lang, status: settled.status, reason: settled.reason ?? null, invariant: inv, want: JSON.parse(want), perModel: raws.map((r, i) => ({ model: MODELS[i], ok: !!r.out && quoteCheck(text, r.out).ok, same: r.out ? canonical(r.out) === want : false, error: r.error ?? null, missingQuotes: r.out ? quoteCheck(text, r.out).missing : null, out: r.out })) });
    console.log(`${s.id} ${form} ${lang}: ${settled.status}${settled.reason ? ` (${settled.reason})` : ''} invariant=${inv} ${rows.at(-1).perModel.map((p) => `${p.model.split(':')[0]}:${p.same ? 'same' : p.ok ? 'differs' : 'invalid'}`).join(' ')}`);
  }
}
for (const t of TRIVIAL) {
  const raws = [];
  for (const m of MODELS) raws.push(await ollamaExtract(m, t.text).catch((e) => ({ out: null, error: String(e.message ?? e) })));
  // A trivial declaration may come back with one pseudo-option ("the decision: none"); two or
  // more options would contradict the claim (countCheck).
  const ok = raws.every((r) => r.out && r.out.trivial_claim === true && (r.out.options ?? []).length <= 1);
  if (ok) trivialOk++;
  rows.push({ id: t.id, trivialOk: ok, perModel: raws.map((r, i) => ({ model: MODELS[i], trivial: r.out?.trivial_claim ?? null, options: r.out?.options?.length ?? null, error: r.error ?? null })) });
  console.log(`${t.id}: trivial read ${ok ? 'ok' : 'MISSED'}`);
}
const summary = { invariant: `${invariant}/${total}`, lineagesAgree: `${agreeN}/${total}`, trivial: `${trivialOk}/${TRIVIAL.length}`, models: MODELS };
console.log(JSON.stringify(summary));
writeFileSync(out, JSON.stringify({ summary, rows }, null, 2));
