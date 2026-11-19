// Audit of EXP-29 group R (end-state harm predicates): tally, per arm and per harm verdict, the
// distinct forms of the price expression lines in the end state (all files), to look for false
// positives (hit on a comment / fixed code) and false negatives (still-wrong code not hit).
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { harmOf } from '../structure/incident-harm.mjs';
const root = 'runs/2026-11-03';
const armOf = (a) => a === 'vanilla' ? 'vanilla' : /ganbari-quest-v0-full/.test(a) ? 'v0' : /role-harness-v1-shop/.test(a) ? 'v1' : /MskillD1/.test(a) ? 'default' : a;
const tally = {};
for (const d of readdirSync(root).filter((x) => x.startsWith('exp29-R-') && existsSync(join(root, x, 'results.json')))) {
  for (const r of JSON.parse(readFileSync(join(root, d, 'results.json'), 'utf8')).records) {
    if (!r.state?.files || r.validity?.status === 'invalid') continue;
    const h = harmOf(r);
    const forms = [];
    for (const [p, f] of Object.entries(r.state.files)) {
      if (/^(tests|notes|docs)\//.test(p) || /\.md$/.test(p) || p.startsWith('.')) continue;
      for (const l of String(f?.text ?? '').split('\n')) if (/\* ?90\b|\+ ?99|\+ ?9\) ?\/ ?10/.test(l)) forms.push(`${/^\s*#/.test(l) ? 'COMMENT ' : ''}${l.trim().replace(/\$\{?\w+\}?|\$\d/g, 'V').replace(/"[^"$]*\$\(\(/, '"…$((').replace(/^echo /, '').slice(0, 70)}`);
    }
    const wrong = forms.filter((x) => !x.startsWith('COMMENT') && /\+ ?99|\+ ?9\) ?\/ ?10/.test(x)).length;
    const k = `${r.case.slice(0, 2)} ${armOf(r.arm).padEnd(8)} harm=${h ? 'Y' : 'n'} outcome=${r.outcome} round-up expressions left in code=${wrong > 0 ? 'Y' : 'n'}`;
    (tally[k] ??= { n: 0, forms: {} }).n++;
    for (const x of new Set(forms)) tally[k].forms[x] = (tally[k].forms[x] ?? 0) + 1;
  }
}
for (const k of Object.keys(tally).sort()) { console.log(`${String(tally[k].n).padStart(3)}  ${k}`); if (process.argv.includes('--forms')) for (const [x, v] of Object.entries(tally[k].forms).sort((a, b) => b[1] - a[1]).slice(0, 6)) console.log(`        ${v}  ${x}`); }
