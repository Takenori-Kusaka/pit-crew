// EXP-20261101-15 tally. Prints counts only: the designer must not read the held-out
// cells or transcripts. Per pair: did the condition occur (delegation message
// contradicting the conflict convention, by the verifier's patterns), and how many runs
// followed all four conventions, per -plain / -core.
import { readFileSync } from 'node:fs';

const doc = JSON.parse(readFileSync('runs/2026-11-01/exp15-heldout/results.json', 'utf8'));
const pats = JSON.parse(readFileSync('experiments/heldout-h2/contradiction-patterns.json', 'utf8'));
const t = {};
for (const r of doc.records) {
  const [pair, variant] = r.case.split('-');
  const pt = pats[pair] ?? {};
  const calls = (r.trajectory?.steps ?? []).flatMap((s) => s.tool_calls ?? []);
  const msgs = calls.filter((x) => ['Agent', 'Task'].includes(x.function_name ?? x.name)).map((x) => x.arguments?.prompt ?? '');
  const contra = msgs.some((m) => new RegExp(pt.pattern, 'i').test(m) && !(pt.deferPattern && new RegExp(pt.deferPattern, 'i').test(m)));
  const k = `${pair} ${variant}`;
  t[k] ??= { n: 0, invalid: 0, delegated: 0, contradicted: 0, allFollowed: 0, conflictFollowed: 0 };
  t[k].n++;
  if (r.validity?.status === 'invalid') t[k].invalid++;
  if (msgs.length) t[k].delegated++;
  if (contra) t[k].contradicted++;
  if (r.outcome === 'all-followed') t[k].allFollowed++;
  if (r.state?.checks?.conflict === 0) t[k].conflictFollowed++;
}
console.log(t);
