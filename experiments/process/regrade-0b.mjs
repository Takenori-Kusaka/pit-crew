// Planning 23 stage 0b: exploratory regrade of existing dev-cell runs with the stage-0a process
// graders. Exploratory only — not used for verdicts (the measures were built after these runs).
// Cells are registered by experiments/process/spec-dev-cells.json (exploratory registration).
// Usage: node experiments/process/regrade-0b.mjs > runs/2026-11-03/regrade-0b.txt
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const groups = [
  ['EXP-26/27 t4・t5w: MskillG (D0) vs MskillD1 (D1)', 'runs/2026-11-03', /^exp2[67]-(big|weak)-(MskillG|MskillD1)-r\d$/, (d) => d.match(/(MskillG|MskillD1)/)[1]],
  ['EXP-28 stage 3 (v0 vs default), all cells', 'runs/2026-11-03', /^exp28r?-(big|types|inc|retry)-/, (d) => (/v0-full/.test(d) ? 'v0' : 'default')],
  ['EXP-29 R (4 arms)', 'runs/2026-11-03', /^exp29-R-/, (d) => d.split('-').pop()],
];
for (const [title, root, re, armOf] of groups) {
  const dirs = readdirSync(root).filter((d) => re.test(d) && existsSync(join(root, d, 'results.json')));
  const byArm = {};
  for (const d of dirs) (byArm[armOf(d)] ??= []).push(join(root, d, 'results.json'));
  console.log(`\n## ${title}`);
  console.log('| arm | n | B precedence met | E met | failure observed before fix | calls before first impl edit | files opened before | N+X | U |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const [arm, files] of Object.entries(byArm).sort()) {
    const out = JSON.parse(execFileSync(process.execPath, ['packages/pit-wall/src/graders/process/cli.mjs', ...files, '--spec', 'experiments/process/spec-dev-cells.json', '--json'], { encoding: 'utf8', maxBuffer: 1 << 28 }));
    const rows = out.rows.filter((r) => r.valid);
    const mean = (f) => (rows.reduce((s, r) => s + (f(r) ?? 0), 0) / rows.length);
    const pct = (v) => `${Math.round(v * 100)}%`;
    const n = rows.length;
    const B = mean((r) => r.B?.share), E = mean((r) => r.E?.share);
    const fail = rows.filter((r) => r.failureObserved).length;
    const cit = rows.reduce((a, r) => { for (const [k, v] of Object.entries(r.cites ?? {})) a[k] = (a[k] ?? 0) + v; return a; }, {});
    const loc = Object.values(cit).reduce((a, b) => a + b, 0) || 1;
    console.log(`| ${arm} | ${n} | ${pct(B)} | ${pct(E)} | ${fail}/${n} | ${mean((r) => r.callsBeforeImpl).toFixed(1)} | ${mean((r) => r.filesOpenedBeforeImpl).toFixed(1)} | ${pct(((cit.N ?? 0) + (cit.X ?? 0)) / loc)} | ${pct((cit.U ?? 0) / loc)} |`);
  }
}
