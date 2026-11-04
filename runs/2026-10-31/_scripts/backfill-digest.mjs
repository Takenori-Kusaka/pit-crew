// one-off: runs from before digests were recorded. Cases listed here were checked by
// hand to have used today's materials (the vendor fixture changed before pw-d1-vendor2).
import { readFileSync, writeFileSync } from 'node:fs';
import { loadSuite } from '../packages/pit-wall/src/suite.mjs';
const suite = loadSuite('../suites/_examples/evaluator-check/suite.yaml');
const d = Object.fromEntries(suite.cases.map((c) => [c.id, c.digest]));
const verified = { 'pw-d1-vendor2': ['vendor-question'], 'pw-h-d1': ['tie-conflict', 'vendor-question', 'self-approve'], 'pw-d1-check': ['tie-conflict', 'self-approve'] };
for (const [dir, cases] of Object.entries(verified)) {
  const p = `${dir}/results.json`; const doc = JSON.parse(readFileSync(p, 'utf8'));
  let n = 0; for (const r of doc.records) if (cases.includes(r.case)) { r.caseDigest = d[r.case]; n++; }
  writeFileSync(p, JSON.stringify(doc, null, 2)); console.log(dir, n);
}
