// Audit: what research.searched separates. Per group x arm: among trials with searched = N / Y,
// the share of the repository's source files (end state, role impl or test, not created by the
// agent) that were fully visible (level O) before the first implementation edit; and, for Y, how
// the search was made (tool) and how many search actions preceded the cut.
// Usage: node experiments/audit-2026-11-12/searched.mjs <config> [--show]
import { load, CONFIGS } from './items.mjs';
import { eventTable, fileRole } from '../../packages/pit-wall/src/graders/process/events.mjs';
import { authoredTexts } from '../../packages/pit-wall/src/graders/process/authored.mjs';
import { visibility, seen } from '../../packages/pit-wall/src/graders/process/visibility.mjs';

const name = process.argv[2] ?? 'exp32';
const show = process.argv.includes('--show');
const cfg = CONFIGS[name];
const rows = load(name).filter((r) => r.checks && r.valid);
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const one = (s, L) => String(s ?? '').split('\n').join(' ⏎ ').slice(0, L);
for (const g of Object.keys(cfg.groups)) {
  console.log(`\n## ${name} ${g}`);
  console.log('| arm | searched N: n, mean share of repo source fully opened before cut, trials with 100% | searched Y: n, same | Y: searches before cut (mean) | Y: only search is on a single named file |');
  for (const a of cfg.arms) {
    const cellsOut = { N: [], Y: [] }; const nSearch = []; let single = 0;
    for (const r of rows.filter((x) => x.group === g && x.arm === a)) {
      const s = r.checks.find((c) => c.id === 'research.searched')?.result;
      if (s == null) continue;
      const table = eventTable(r.record);
      const authored = authoredTexts(r.record, table);
      const vis = visibility(table, authored);
      const cut = r.facts.firstImpl ?? Infinity;
      const src = Object.keys(vis.files).filter((p) => ['impl', 'test'].includes(fileRole(p, { implFiles: r.opts.implFiles ?? [] })) && !vis.created.has(p) && vis.files[p] != null);
      const o = src.filter((p) => seen(vis, p, cut)?.level === 'O').length;
      cellsOut[s ? 'Y' : 'N'].push(src.length ? o / src.length : null);
      if (s) {
        const ss = table.events.flatMap((e) => e.actions.filter((x) => (x.type === 'search' || (x.type === 'history' && x.pickaxe)) && x.pos < cut).map((x) => ({ e, x })));
        nSearch.push(ss.length);
        if (ss.every(({ x }) => (x.paths ?? []).length === 1 && !/\/$/.test(x.paths[0]) && vis.files[x.paths[0]] != null)) single++;
        if (show && a === 'default') console.log(`    [${r.cell}#${r.k}] ${ss.slice(0, 2).map(({ e, x }) => `${e.i}:${x.tool} /${one(x.pattern, 40)}/ paths=${(x.paths ?? []).slice(0, 3).join(',')}${(x.paths ?? []).length > 3 ? '…' : ''}`).join(' ; ')}`);
      }
    }
    const f = (k) => { const v = cellsOut[k].filter((x) => x != null); return `${cellsOut[k].length}, ${v.length ? mean(v).toFixed(2) : '-'}, ${v.filter((x) => x === 1).length}`; };
    console.log(`| ${a} | ${f('N')} | ${f('Y')} | ${nSearch.length ? mean(nSearch).toFixed(1) : '-'} | ${single}/${nSearch.length} |`);
  }
}
