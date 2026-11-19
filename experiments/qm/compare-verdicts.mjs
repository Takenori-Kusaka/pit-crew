// Compare the author's expected verdicts with the independent re-derivation, printing only
// what the harness designer may see: counts, the ids that agree / disagree, and the
// re-derivation's confidence per id. No reasons, no cell contents.
//
// Usage: node experiments/qm/compare-verdicts.mjs [author=experiments/qm/verdicts.json] [rederive=experiments/qm/rederive/verdicts.json]
import { readFileSync, writeFileSync } from 'node:fs';

const [a = 'experiments/qm/verdicts.json', r = 'experiments/qm/rederive/verdicts.json', out = 'experiments/qm/rederive/agreement.json'] = process.argv.slice(2);
const author = JSON.parse(readFileSync(a, 'utf8'));
const re = JSON.parse(readFileSync(r, 'utf8'));
const authorById = Object.fromEntries((Array.isArray(author) ? author : Object.values(author)).map((v) => [v.case ?? v.id, v]));
// Author verdicts: pass | block | route. Re-derivation: pass | block | route+pass | route+block | route-only.
const base = (v) => String(v ?? '').toLowerCase().replace(/^route.*/, 'route');
const rows = Object.keys(authorById).sort().map((id) => {
  const av = base(authorById[id].verdict);
  const rv = re[id] ? base(re[id].verdict) : null;
  return { id, agree: rv != null && av === rv, author: av, rederive: rv, confidence: re[id]?.confidence ?? null, missing: rv == null };
});
const agree = rows.filter((x) => x.agree), disagree = rows.filter((x) => !x.agree && !x.missing), missing = rows.filter((x) => x.missing);
const conf = {}; for (const x of rows) if (x.confidence) conf[x.confidence] = (conf[x.confidence] ?? 0) + 1;
const summary = { total: rows.length, agree: agree.length, disagree: disagree.length, missing: missing.length, confidence: conf,
  kept: agree.map((x) => x.id), discarded: disagree.map((x) => ({ id: x.id, author: x.author, rederive: x.rederive, confidence: x.confidence })), missingIds: missing.map((x) => x.id) };
writeFileSync(out, JSON.stringify(summary, null, 2));
console.log(`agree ${agree.length}/${rows.length}, disagree ${disagree.length}, missing ${missing.length}; confidence ${JSON.stringify(conf)}`);
console.log(`kept: ${summary.kept.join(' ')}`);
if (disagree.length) console.log(`discarded: ${disagree.map((x) => `${x.id}(${x.author}/${x.rederive},${x.confidence})`).join(' ')}`);
