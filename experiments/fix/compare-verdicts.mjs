// Compare the author's expected handling of each finding with the independent re-derivation,
// printing only what the harness designer may see: counts and cell ids that agree / disagree,
// plus the re-derivation's confidence and whether it left an ambiguity note. No reasons, no
// finding texts, no file names. A cell is KEPT when every finding's verdict (fix / reject / route)
// agrees and, for route, the destination agrees; otherwise it is discarded (not fixed).
//
// Usage: node experiments/fix/compare-verdicts.mjs [author=experiments/fix/verdicts.json] [rederive=tmp/fix-rederive/verdicts.json] [out=experiments/fix/rederive/agreement.json]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const [a = 'experiments/fix/verdicts.json', r = 'tmp/fix-rederive/verdicts.json', out = 'experiments/fix/rederive/agreement.json'] = process.argv.slice(2);
const author = JSON.parse(readFileSync(a, 'utf8'));
const re = JSON.parse(readFileSync(r, 'utf8'));
const spec = JSON.parse(readFileSync('experiments/fix/process-spec.json', 'utf8'));
const norm = (s) => String(s ?? '').toLowerCase().trim();
// Optional 4th argument `--only-rederived`: a second set re-derives only its own cells, so limit the
// rows to the cells present in the re-derivation file (the others are not "missing", just out of the set).
const onlyRederived = process.argv.slice(2).includes('--only-rederived');
const rows = author.filter((c) => !onlyRederived || c.case in re).map((c) => {
  const rc = re[c.case];
  if (!rc) return { id: c.case, type: c.type, missing: true, agree: false };
  const routeOf = Object.fromEntries((spec[c.case]?.findings ?? []).map((f) => [f.id, f.routeTo ?? null]));
  const per = c.findings.map((f) => {
    const rf = (rc.findings ?? []).find((x) => x.id === f.id);
    const verdictAgree = !!rf && norm(rf.verdict) === norm(f.expect);
    const routeAgree = norm(f.expect) !== 'route' || !rf ? true : norm(rf.routeTo) === norm(routeOf[f.id]);
    return { id: f.id, verdictAgree, routeAgree, confidence: rf?.confidence ?? null };
  });
  const disagreeing = per.filter((p) => !p.verdictAgree || !p.routeAgree).length;
  return { id: c.case, type: c.type, findings: per.length, disagreeing, routeDestinationMismatch: per.filter((p) => p.verdictAgree && !p.routeAgree).length, lowConfidence: per.filter((p) => p.confidence === 'low').length, ambiguityNote: !!String(rc.notes ?? '').trim(), agree: disagreeing === 0, missing: false };
});
const kept = rows.filter((x) => x.agree), dropped = rows.filter((x) => !x.agree);
const summary = { cells: rows.length, kept: kept.length, discarded: dropped.length, keptIds: kept.map((x) => x.id), discardedIds: dropped.map((x) => x.id), findings: rows.reduce((s, x) => s + (x.findings ?? 0), 0), findingsDisagreeing: rows.reduce((s, x) => s + (x.disagreeing ?? 0), 0), keptWithAmbiguityNote: kept.filter((x) => x.ambiguityNote).map((x) => x.id), keptWithLowConfidence: kept.filter((x) => x.lowConfidence).map((x) => x.id) };
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 1));
for (const x of rows) console.log(`${x.id} (${x.type}): ${x.missing ? 'MISSING' : x.agree ? 'agree' : `DISAGREE ${x.disagreeing}/${x.findings}${x.routeDestinationMismatch ? ` (route destination ${x.routeDestinationMismatch})` : ''}`}${x.lowConfidence ? ' low-confidence' : ''}${x.ambiguityNote ? ' note' : ''}`);
