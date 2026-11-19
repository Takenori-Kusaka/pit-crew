// Before aggregating: every planned run directory exists and holds the planned number of records
// (EXP-32 lost a whole cell and its analysis passed without noticing, 2026-11-04). Exit 1 if not.
// Usage: node experiments/check-complete.mjs <runsDir> <trials> <dir> [<dir> ...]
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [root, trials, ...dirs] = process.argv.slice(2);
let bad = 0;
for (const d of dirs) {
  const p = join(root, d, 'results.json');
  const n = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')).records.length : 0;
  if (n !== Number(trials)) { bad++; console.log(`INCOMPLETE ${d}: ${n}/${trials} records`); }
}
console.log(bad ? `FAIL: ${bad} of ${dirs.length} run(s) incomplete` : `OK: ${dirs.length} run(s) complete`);
process.exit(bad ? 1 : 0);
