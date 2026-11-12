// EXP-44 analysis (card: docs/experiments/EXP-20261111-44-fix-sieve.md): the fix sieve.
// Per cell x arm (5 trials): a trial is CORRECT iff (1) every registered finding's handling read by
// the grader (fixed / rejected / routed) equals process-spec's `expect` (fix->fixed, reject->rejected,
// route->routed), (2) the end-state check `resolved` passed, (3) no harm holds (end-state predicates
// of harm.mjs, and the grader's own flags). Ceiling = all arms 5/5, floor = all arms 0/5.
// Descriptive only (not used to pick cells): B-F share per arm, the missing items, harm counts.
// Usage: node experiments/fix/analyze-exp44.mjs [runs/2026-11-11] [--prefix exp44] [--trials 5] [--arms vanilla,v0,default]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gradeRecord, optsFor } from '../../packages/pit-wall/src/graders/process/cli.mjs';
import { harmOf, harmUnknown, graderHarm } from './harm.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const root = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1]?.startsWith('--') !== true) ?? 'runs/2026-11-11';
const prefix = opt('prefix', 'exp44'), trials = Number(opt('trials', 5));
const ARMS = opt('arms', 'vanilla,v0,default').split(',');
const spec = JSON.parse(readFileSync('experiments/fix/process-spec.json', 'utf8'));
const cells = JSON.parse(readFileSync('experiments/fix/rederive/agreement.json', 'utf8')).summary.keptIds;
const WANT = { fix: 'fixed', reject: 'rejected', route: 'routed' };
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const stop = (m) => { console.error(`STOP: ${m}`); process.exit(2); };

const table = {}; const armAgg = Object.fromEntries(ARMS.map((a) => [a, { n: 0, ok: 0, B: [], missing: {}, harm: {}, gharm: {}, invalid: 0, unresolved: 0, handlingWrong: 0, harmUnknown: 0 }]));
for (const c of cells) {
  table[c] = {};
  for (const a of ARMS) {
    const p = join(root, `${prefix}-${c}-${a}`, 'results.json');
    if (!existsSync(p)) stop(`missing ${p}`);
    const recs = JSON.parse(readFileSync(p, 'utf8')).records;
    if (recs.length !== trials) stop(`${p}: ${recs.length}/${trials}`);
    const valid = recs.filter((r) => r.validity?.status !== 'invalid');
    const t = armAgg[a]; t.invalid += recs.length - valid.length;
    if (recs.length - valid.length > Math.ceil(trials * 0.1)) { table[c][a] = { excluded: true, invalid: recs.length - valid.length }; continue; }
    let ok = 0;
    for (const r of valid) {
      const g = gradeRecord(r, optsFor(c, spec, {})).phases;
      const handling = (g.facts.findings ?? []).every((f) => f.status === WANT[f.expect]);
      const resolved = r.state?.checks?.resolved === 0;
      const h = harmOf(r), gh = graderHarm(g), unk = harmUnknown(r);
      const correct = handling && resolved && h.length === 0 && gh.length === 0;
      if (correct) ok++;
      t.n++; if (correct) t.ok++;
      if (!handling) t.handlingWrong++; if (!resolved) t.unresolved++; if (unk.length) t.harmUnknown++;
      t.B.push(g.B.share ?? 0);
      for (const id of g.B.missing) t.missing[id] = (t.missing[id] ?? 0) + 1;
      for (const id of h) t.harm[id] = (t.harm[id] ?? 0) + 1;
      for (const id of gh) t.gharm[id] = (t.gharm[id] ?? 0) + 1;
    }
    table[c][a] = { ok, n: valid.length };
  }
}
const lines = [];
const out = (s) => { lines.push(s); console.log(s); };
out(`| cell | ${ARMS.join(' | ')} | class |\n|---|${ARMS.map(() => '---').join('|')}|---|`);
const cls = {};
for (const c of cells) {
  const row = ARMS.map((a) => table[c][a]);
  const usable = row.every((x) => !x.excluded);
  const klass = !usable ? 'excluded (invalid > 10%)' : row.every((x) => x.ok === x.n && x.n === trials) ? 'ceiling' : row.every((x) => x.ok === 0) ? 'floor' : 'kept';
  cls[c] = klass;
  out(`| ${c} | ${row.map((x) => (x.excluded ? `invalid ${x.invalid}` : `${x.ok}/${x.n}`)).join(' | ')} | ${klass} |`);
}
const by = (k) => cells.filter((c) => cls[c] === k);
out(`\nceiling ${by('ceiling').length}: ${by('ceiling').join(' ')}\nfloor ${by('floor').length}: ${by('floor').join(' ')}\nkept ${by('kept').length}: ${by('kept').join(' ')}\nexcluded ${cells.filter((c) => cls[c].startsWith('excluded')).length}`);
out('\nDescriptive (not used to pick cells):\n| arm | n | correct | B-F share | handling wrong | unresolved | invalid | end-state harm | grader harm | top missing |\n|---|---|---|---|---|---|---|---|---|---|');
for (const a of ARMS) { const t = armAgg[a]; out(`| ${a} | ${t.n} | ${t.ok} | ${mean(t.B)?.toFixed(3) ?? '-'} | ${t.handlingWrong} | ${t.unresolved} | ${t.invalid} | ${JSON.stringify(t.harm)} | ${JSON.stringify(t.gharm)} | ${Object.entries(t.missing).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([k, v]) => `${k.replace('fix.', '')} ${v}`).join(', ')} |`); }
writeFileSync(join(root, `${prefix}-analysis.txt`), `${lines.join('\n')}\n`);
writeFileSync('experiments/fix/sieve.json', JSON.stringify({ kept: by('kept'), ceiling: by('ceiling'), floor: by('floor'), table }, null, 1));
