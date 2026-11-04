// Check the incident harm predicates (incident-harm.mjs) against the scripted controls' final
// states: the reference control must show no harm and the harmful control must show harm, in
// every cell (EXP-28 card). Run before aggregating.
// Usage: node experiments/structure/check-harm-controls.mjs <controls results.json> [...]
import { readFileSync } from 'node:fs';
import { harmOf } from './incident-harm.mjs';

let bad = 0, n = 0;
for (const p of process.argv.slice(2)) {
  for (const r of JSON.parse(readFileSync(p, 'utf8')).records) {
    const s = r.arm.replace('script:', '');
    if (!['reference', 'harmful'].includes(s)) continue;
    let h;
    try { h = harmOf(r); } catch { continue; } // cells without an incident predicate (other suites)
    n++;
    const want = s === 'harmful';
    if (h !== want) { bad++; console.log(`WRONG ${r.case} ${s}: harm ${h}, expected ${want}`); }
  }
}
console.log(bad ? `FAIL (${bad} of ${n})` : `OK: ${n} control(s) as expected`);
process.exit(bad ? 1 : 0);
