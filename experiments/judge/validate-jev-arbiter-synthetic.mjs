// Label-free check of Jev (Noul) as a skeleton lineage, on the synthetic oracle used for the local
// extractors: for each rendering (5 structures × table/bullets/prose × en/ja × {all options present,
// one option absent}) ask, per planted option, "mentioned?" / "adopted?"; the renderer's structure is
// the truth. Reports mention accuracy (overall and on the ABSENT option), adoption accuracy, and
// skeleton correctness at thresholds 0.5 / 0.6 / 0.7. Network only; cost printed; key never printed.
// Usage: node experiments/judge/validate-jev-arbiter-synthetic.mjs
import { writeFileSync } from 'node:fs';
import { RENDERINGS, renderAs } from '../../packages/pit-wall/src/graders/process/judge/extract.mjs';
import { apiKey, systemOne, arbitrationQuestions } from '../../packages/pit-wall/src/graders/process/judge/jev.mjs';
import { STRUCTURES } from './synthetic-structures.mjs';

if (!apiKey()) { console.error('no key'); process.exit(2); }
const cases = [];
for (const s of STRUCTURES) for (const [form, lang] of RENDERINGS) {
  const planted = s.options.map((o, i) => ({ id: `p${i}`, text: o.text, adopted: !!o.adopted }));
  cases.push({ id: s.id, form, lang, variant: 'all', text: renderAs(s, form, lang), planted, truth: planted.map((p) => ({ id: p.id, mentioned: true, adopted: p.adopted })) });
  const dropIdx = s.options.map((o, i) => [o, i]).filter(([o]) => !o.adopted).at(-1)[1];
  const sub = { ...s, options: s.options.filter((_, i) => i !== dropIdx) };
  cases.push({ id: s.id, form, lang, variant: 'one-absent', text: renderAs(sub, form, lang), planted, truth: planted.map((p, i) => ({ id: p.id, mentioned: i !== dropIdx, adopted: p.adopted })), absentId: `p${dropIdx}` });
}
let tokens = 0, errors = 0;
const rows = [];
for (const c of cases) {
  const answers = [];
  for (const o of c.planted) {
    const { state, questions } = arbitrationQuestions(c.text, o.text);
    const r = await systemOne(state, questions).catch((e) => { errors++; return { error: String(e.message ?? e) }; });
    tokens += r.usage?.input_tokens ?? 0;
    answers.push({ id: o.id, mentioned: r.answers?.mentioned?.noul ?? null, adopted: r.answers?.adopted?.noul ?? null });
  }
  rows.push({ ...c, text: undefined, answers });
}
const summary = {};
for (const th of [0.5, 0.6, 0.7]) {
  let mentN = 0, mentOk = 0, absN = 0, absOk = 0, adoptN = 0, adoptOk = 0, skelN = 0, skelOk = 0;
  for (const r of rows) {
    let all = true;
    for (const t of r.truth) {
      const a = r.answers.find((x) => x.id === t.id); if (a.mentioned == null) { all = false; continue; }
      const m = a.mentioned >= th; mentN++; if (m === t.mentioned) mentOk++; else all = false;
      if (r.variant === 'one-absent' && t.id === r.absentId) { absN++; if (!m) absOk++; }
      if (t.mentioned) { const ad = m && a.adopted >= th; adoptN++; if (ad === t.adopted) adoptOk++; else all = false; }
    }
    skelN++; if (all) skelOk++;
  }
  summary[`th${th}`] = { mention: `${mentOk}/${mentN}`, absentOptionReadAsAbsent: `${absOk}/${absN}`, adoption: `${adoptOk}/${adoptN}`, skeletonCorrect: `${skelOk}/${skelN}` };
}
summary.jevInputTokens = tokens; summary.errors = errors; summary.costUSD = +(tokens / 1e6 * 0.042).toFixed(4);
console.log(JSON.stringify(summary, null, 1));
writeFileSync(`experiments/judge/validate-jev-arbiter-synthetic-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ summary, rows }, null, 2));
