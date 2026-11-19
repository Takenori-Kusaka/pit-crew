// Auditor: what the acts behind review.no-edits = false are (command shapes), per arm.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eventTable } from '../../packages/pit-wall/src/graders/process/events.mjs';
const rows = JSON.parse(readFileSync('experiments/audit-2026-11-12/qm-regrade.json', 'utf8')).filter((r) => r.valid && !r.excluded && r.checks['review.no-edits'] === false);
const cache = new Map();
const rec = (r) => { const p = join('runs/2026-11-05', `${r.exp}-${r.cell}-${r.arm}`, 'results.json'); if (!cache.has(p)) cache.set(p, JSON.parse(readFileSync(p, 'utf8')).records); return cache.get(p)[r.k]; };
const T = {}; const show = Number(process.argv[2] ?? 0); let shown = 0;
const res = [];
for (const r of rows) {
  const R = rec(r), t = eventTable(R);
  const pos = new Set(r.facts.edits.map((e) => Math.floor(e.pos)));
  const cmds = t.events.filter((e) => pos.has(e.i)).map((e) => e.command ?? `${e.tool} ${JSON.stringify(e.input).slice(0, 200)}`);
  const all = cmds.join('\n');
  const applyCheck = /git\s+apply\s+[^|;&\n]*--(check|stat|numstat|summary)/.test(all);
  const applyReal = /git\s+apply(?![^|;&\n]*--(check|stat|numstat|summary))/.test(all);
  const elsewhere = /(cd|-C|git worktree add|cp -r[^;\n]*|mktemp|rsync[^;\n]*)\s*[^;\n]*\/tmp|cd "?\$\w+|git clone|GIT_DIR|--directory/.test(all);
  const reverted = /git\s+(apply\s+-R|checkout\s+(--\s+)?\.|checkout\s+-q\s+--|restore|stash|reset\s+--hard|clean)|apply -R|-R\b/.test(t.events.map((e) => e.command ?? '').join('\n'));
  // end state: did any registered changed / repo file differ? use the record's own history check
  const kinds = [...new Set(r.facts.edits.map((e) => (e.what.startsWith('git ') || e.what === 'commit' ? e.what : 'write')))].sort().join('+');
  const cls = `${kinds}${applyCheck && !applyReal ? ' [apply --check/--stat only]' : ''}${elsewhere ? ' [in a copy / other dir]' : ''}${reverted ? ' [restore/revert present]' : ''}`;
  const key = `${r.exp}|${r.arm}`; T[key] ??= {}; T[key][cls] = (T[key][cls] ?? 0) + 1;
  res.push({ exp: r.exp, cell: r.cell, arm: r.arm, k: r.k, cls, cmds });
  if (shown < show && (!process.argv[3] || r.arm === process.argv[3])) { shown++; console.log(`--- ${r.exp} ${r.cell} ${r.arm} #${r.k} edits=${JSON.stringify(r.facts.edits)}`); for (const c of cmds) console.log('   ', c.slice(0, 700).replace(/\n/g, ' ⏎ ')); }
}
for (const k of Object.keys(T).sort()) console.log(k, JSON.stringify(T[k]));
