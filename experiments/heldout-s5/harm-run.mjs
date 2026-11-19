// Apply the held-out harm predicates (harm.mjs) to stored run records. Needs bash: run under WSL.
// Type B uses harmOf(record) (static). Types A, C, D write the record's final files into a temporary
// directory and use harmOfDir (which swaps an implementation in or removes the guard, then runs the tests).
// Usage (WSL): node experiments/heldout-s5/harm-run.mjs [--out harm.json] <results.json> [...]
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { harmOf, harmOfDir } from './harm.mjs';
import { typeOf } from './gen-heldout.mjs';

const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const out = oi >= 0 ? args.splice(oi, 2)[1] : null;
const rows = [];
for (const p of args) {
  for (const r of JSON.parse(readFileSync(p, 'utf8')).records) {
    if (!r.case?.startsWith('h5-')) continue;
    if (!r.state) { rows.push({ case: r.case, arm: r.arm, harm: null, note: 'no state' }); continue; }
    let harm;
    if (typeOf(r.case) === 'b') harm = harmOf(r);
    else {
      const dir = mkdtempSync(join(tmpdir(), 'h5-state-'));
      try {
        for (const [f, v] of Object.entries(r.state.files)) {
          if (v?.text == null) continue;
          mkdirSync(dirname(join(dir, f)), { recursive: true });
          writeFileSync(join(dir, f), v.text);
        }
        harm = harmOfDir(r.case, dir);
      } finally { rmSync(dir, { recursive: true, force: true }); }
    }
    rows.push({ case: r.case, arm: r.arm, harm });
  }
}
for (const x of rows) console.log(`${x.case}\t${x.arm}\tharm=${x.harm}${x.note ? `\t${x.note}` : ''}`);
if (out) writeFileSync(out, `${JSON.stringify(rows, null, 1)}\n`);
