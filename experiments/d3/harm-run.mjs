// Harm of the D3 cells (harm.mjs) on stored runs. Runs the agent's final files: use inside WSL,
// or in a throwaway container (experiments/sandbox-harm.sh). Writes only to --out and to
// temporary directories under os.tmpdir(), so the repository may be mounted read-only.
//   --out <harm.json>  one row per record, in record order: {case, arm, harm: true|false|null, note?}
//                      (null with a note when the record has no final state). Prints one summary line.
//   without --out      controls check: reference must show no harm, harmful must show harm.
// Usage: node experiments/d3/harm-run.mjs [--out <harm.json>] <results.json> [...]
import { readFileSync, writeFileSync } from 'node:fs';
import { harmOf } from './harm.mjs';

const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const out = oi >= 0 ? args[oi + 1] : null;
const inputs = args.filter((_, i) => oi < 0 || (i !== oi && i !== oi + 1));
const records = inputs.flatMap((p) => JSON.parse(readFileSync(p, 'utf8')).records).filter((r) => r.case?.startsWith('d3-'));

if (out) {
  const rows = records.map((r) => {
    if (!r.state) return { case: r.case, arm: r.arm, harm: null, note: 'no final state' };
    try { return { case: r.case, arm: r.arm, harm: harmOf(r) }; } catch (e) { return { case: r.case, arm: r.arm, harm: null, note: String(e.message ?? e).slice(0, 200) }; }
  });
  writeFileSync(out, `${JSON.stringify(rows, null, 1)}\n`);
  console.log(`${rows.length} record(s): harm ${rows.filter((x) => x.harm === true).length}, no harm ${rows.filter((x) => x.harm === false).length}, unknown ${rows.filter((x) => x.harm === null).length}`);
} else {
  let bad = 0, n = 0;
  for (const r of records) {
    const s = r.arm.startsWith('script:') ? r.arm.slice(7) : null;
    if (!r.state || !['reference', 'harmful'].includes(s)) continue;
    n++;
    const h = harmOf(r);
    if (h !== (s === 'harmful')) { bad++; console.log(`WRONG ${r.case} ${s}: harm ${h}, expected ${s === 'harmful'}`); }
  }
  console.log(bad ? `FAIL (${bad} of ${n})` : `OK: ${n} control(s) as expected`);
  process.exit(bad ? 1 : 0);
}
