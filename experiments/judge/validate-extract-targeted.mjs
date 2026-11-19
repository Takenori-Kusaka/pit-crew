// Validate TARGETED extraction without labels, by construction: for a synthetic decision with
// planted options, render the notes in 6 forms with (a) all options mentioned and one adopted,
// (b) one planted option ABSENT from the notes (must come back mentioned=false), (c) a trivial
// declaration (no options; trivial_claim). Two lineages must agree on the skeleton; the oracle is
// the structure the renderer was given. Usage (WSL, ollama up): node experiments/judge/validate-extract-targeted.mjs --models=qwen3:8b,llama3.1:8b
import { writeFileSync } from 'node:fs';
import { RENDERINGS, renderAs, extractTargetedBatch, targetedSkeleton } from '../../packages/pit-wall/src/graders/process/judge/extract.mjs';
import { STRUCTURES, TRIVIAL } from './synthetic-structures.mjs';

const MODELS = (process.argv.find((a) => a.startsWith('--models='))?.slice(9) ?? 'qwen3:8b,llama3.1:8b').split(',');
const out = process.argv.find((a) => a.startsWith('--out='))?.slice(6) ?? `experiments/judge/validate-extract-targeted-${new Date().toISOString().slice(0, 10)}.json`;
const items = [], expect = [];
for (const s of STRUCTURES) {
  const planted = s.options.map((o, i) => ({ id: `p${i}`, text: o.text }));
  for (const [form, lang] of RENDERINGS) {
    // (a) all mentioned
    items.push({ text: renderAs(s, form, lang), options: planted });
    expect.push({ id: s.id, form, lang, variant: 'all', skeleton: JSON.stringify({ o: planted.map((p, i) => [p.id, true, s.options[i].adopted]).sort((a, b) => a[0].localeCompare(b[0])), t: false }) });
    // (b) the last non-adopted option left out of the notes
    const dropIdx = s.options.map((o, i) => [o, i]).filter(([o]) => !o.adopted).at(-1)[1];
    const sub = { ...s, options: s.options.filter((_, i) => i !== dropIdx) };
    items.push({ text: renderAs(sub, form, lang), options: planted });
    expect.push({ id: s.id, form, lang, variant: 'one-absent', skeleton: JSON.stringify({ o: planted.map((p, i) => [p.id, i !== dropIdx, s.options[i].adopted]).sort((a, b) => a[0].localeCompare(b[0])), t: false }) });
  }
}
for (const t of TRIVIAL) { const planted = [{ id: 'p0', text: 'fix the constant in place' }, { id: 'p1', text: 'rewrite the module' }]; items.push({ text: t.text, options: planted }); expect.push({ id: t.id, variant: 'trivial', skeleton: null }); }
const batch = await extractTargetedBatch(MODELS, items, { onProgress: (m, i, n) => { if (i % 10 === 0 || i === n) console.log(`${m}: ${i}/${n}`); } });
let ok = 0, agree = 0, trivialOk = 0, n = 0, nt = 0;
const rows = [];
items.forEach((it, k) => {
  const e = expect[k], s = batch.get(it);
  if (e.variant === 'trivial') { nt++; const t = s.valid.every((v) => v.trivial_claim === true) && s.valid.length === MODELS.length; if (t) trivialOk++; rows.push({ ...e, status: s.status, trivialOk: t, perModel: s.raws.map((r) => r.out ? { trivial: r.out.trivial_claim, mentioned: r.out.options.filter((o) => o.mentioned).length } : { error: r.error }) }); return; }
  n++; const got = s.out ? targetedSkeleton(s.out) : null; const inv = got === e.skeleton; if (inv) ok++; if (s.status === 'ok') agree++;
  rows.push({ ...e, status: s.status, reason: s.reason ?? null, correct: inv, perModel: s.raws.map((r) => r.out ? { skeletonMatches: targetedSkeleton(r.out) === e.skeleton, valid: s.valid.includes(r.out) } : { error: r.error }) });
  console.log(`${e.id} ${e.form} ${e.lang} ${e.variant}: ${s.status}${s.reason ? ` (${s.reason})` : ''} correct=${inv} ${rows.at(-1).perModel.map((p, i) => `${MODELS[i].split(':')[0]}:${p.error ? 'err' : p.skeletonMatches ? 'same' : p.valid ? 'differs' : 'invalid'}`).join(' ')}`);
});
const summary = { skeletonCorrect: `${ok}/${n}`, lineagesAgree: `${agree}/${n}`, trivial: `${trivialOk}/${nt}`, models: MODELS };
console.log(JSON.stringify(summary));
writeFileSync(out, JSON.stringify({ summary, rows }, null, 2));
