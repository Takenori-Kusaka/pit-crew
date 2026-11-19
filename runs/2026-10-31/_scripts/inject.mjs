// one-off: reuse verdicts from judge-agree output instead of calling the judge again
import { readFileSync, writeFileSync } from 'node:fs';
const [res, rowsFile, model, out] = process.argv.slice(2);
const doc = JSON.parse(readFileSync(res, 'utf8'));
const rows = JSON.parse(readFileSync(rowsFile, 'utf8'));
for (const r of doc.records) {
  r.judged = {};
  for (const x of rows.filter((x) => x.arm === r.arm && x.case === r.case && x.trial === r.trial)) r.judged[x.grader] = { passed: x.pitwall, reason: x.reason, model };
}
writeFileSync(out, JSON.stringify(doc));
