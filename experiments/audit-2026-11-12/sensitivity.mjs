// Audit: B share per group x arm under item-drop and reading variants. Descriptive only.
// Usage: node experiments/audit-2026-11-12/sensitivity.mjs <config>
import { load, CONFIGS } from './items.mjs';
import { gradePhases as gradeTol } from './phases-tolerant.mjs';

const name = process.argv[2] ?? 'exp32';
const cfg = CONFIGS[name];
const rows = load(name).filter((r) => r.checks && r.valid);
for (const r of rows) r.tol = gradeTol(r.record, { trajectory: 'T1', bug: false, base: false, ...r.opts }).checks;
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const share = (checks, drop = []) => { const q = checks.filter((c) => c.series === 'B' && c.result !== null && !drop.includes(c.id)); return q.length ? q.filter((c) => c.result === true).length / q.length : null; };
const VAR = {
  'published (all B items)': (r) => share(r.checks),
  'drop W (no-stale-claim)': (r) => share(r.checks, ['eval.no-stale-claim']),
  'drop searched': (r) => share(r.checks, ['research.searched']),
  'drop W + searched': (r) => share(r.checks, ['eval.no-stale-claim', 'research.searched']),
  'drop base items': (r) => share(r.checks, ['research.base-checked', 'research.base-brought']),
  'tolerant failure signal': (r) => share(r.tol),
  'tolerant + drop W': (r) => share(r.tol, ['eval.no-stale-claim']),
  'tolerant + drop searched': (r) => share(r.tol, ['research.searched']),
  'only T-order items (written/red/failure-observed), published': (r) => { const q = r.checks.filter((c) => ['test.written-before-impl', 'test.red-before-impl', 'research.failure-observed'].includes(c.id) && c.result !== null); return q.length ? q.filter((c) => c.result).length / q.length : null; },
  'only T-order items, tolerant': (r) => { const q = r.tol.filter((c) => ['test.written-before-impl', 'test.red-before-impl', 'research.failure-observed'].includes(c.id) && c.result !== null); return q.length ? q.filter((c) => c.result).length / q.length : null; },
};
const out = {};
for (const g of Object.keys(cfg.groups)) {
  console.log(`\n## ${name} ${g}`);
  console.log(`| variant | ${cfg.arms.join(' | ')} | ${cfg.arms.filter((a) => a !== cfg.ref ?? 'default').map((a) => `d-${a}`).join(' | ')} |`);
  for (const [v, f] of Object.entries(VAR)) {
    const m = Object.fromEntries(cfg.arms.map((a) => [a, mean(rows.filter((r) => r.group === g && r.arm === a).map(f).filter((x) => x != null))]));
    const ref = cfg.ref ?? 'default';
    console.log(`| ${v} | ${cfg.arms.map((a) => m[a].toFixed(3)).join(' | ')} | ${cfg.arms.filter((a) => a !== ref).map((a) => (m[ref] - m[a] >= 0 ? '+' : '') + (m[ref] - m[a]).toFixed(3)).join(' | ')} |`);
  }
  // flips caused by the tolerant signal
  console.log('flips N->Y under the tolerant signal (failure-observed / red-before-impl):');
  for (const a of cfg.arms) {
    const rs = rows.filter((r) => r.group === g && r.arm === a);
    const fl = (id) => rs.filter((r) => r.checks.find((c) => c.id === id)?.result === false && r.tol.find((c) => c.id === id)?.result === true).length;
    const N = (id) => rs.filter((r) => r.checks.find((c) => c.id === id)?.result === false).length;
    console.log(`  ${a}: failure-observed ${fl('research.failure-observed')}/${N('research.failure-observed')}  red-before-impl ${fl('test.red-before-impl')}/${N('test.red-before-impl')}`);
  }
  // per-cell published means
  const G = cfg.groups[g];
  console.log(`per cell (published): ${G.cells.map((c) => `${c}: ${cfg.arms.map((a) => mean(rows.filter((r) => r.group === g && r.arm === a && r.cell === c).map((r) => share(r.checks))).toFixed(2)).join('/')}`).join('  ')}`);
  console.log(`per cell (tolerant):  ${G.cells.map((c) => `${c}: ${cfg.arms.map((a) => mean(rows.filter((r) => r.group === g && r.arm === a && r.cell === c).map((r) => share(r.tol))).toFixed(2)).join('/')}`).join('  ')}`);
}

// --- hand-corrected variant: tolerant signal + trials the auditor read and judged "red run
// happened before the first implementation edit but was not recognised" (failure lines without
// a recognised token, status masked by a later command) + searches that only touch the skill's
// own state-file housekeeping counted as not searched.
import { eventTable } from '../../packages/pit-wall/src/graders/process/events.mjs';
const HAND = new Set(['dev/t4-scatter-big-start#6 v0', 'heldout/h5-c1#3 vanilla', 'heldout/h5-c1#9 vanilla', 'heldout/h5-c1#7 v1', 'heldout/h5-c1#9 v1', 'd3/d3-3#4 v0', 'd3/d3-3#7 v0', 'd3/d3-4#2 v0', 'd3/d3-4#12 v1']);
const artefactOnly = (r) => {
  if (r.checks.find((c) => c.id === 'research.searched')?.result !== true) return false;
  const cut = r.facts.firstImpl ?? Infinity;
  const ss = eventTable(r.record).events.flatMap((e) => e.actions.filter((x) => (x.type === 'search' || (x.type === 'history' && x.pickaxe)) && x.pos < cut));
  return ss.length > 0 && ss.every((x) => /dev-state/.test(String(x.pattern ?? '')) || ((x.paths ?? []).length === 1 && /(^|\/)\.gitignore$/.test(x.paths[0])));
};
const corrected = (r) => r.tol.map((c) => {
  if (HAND.has(`${r.group}/${r.cell}#${r.k} ${r.arm}`) && ['research.failure-observed', 'test.red-before-impl'].includes(c.id) && c.result === false) return { ...c, result: true };
  if (c.id === 'research.searched' && artefactOnly(r)) return { ...c, result: false };
  return c;
});
console.log('\n## hand-corrected (tolerant signal + 8 read trials + state-file-only searches not counted)');
for (const g of Object.keys(cfg.groups)) {
  const ref = cfg.ref ?? 'default';
  const m = (f) => Object.fromEntries(cfg.arms.map((a) => [a, mean(rows.filter((r) => r.group === g && r.arm === a).map(f).filter((x) => x != null))]));
  const line = (label, mm) => console.log(`| ${g} ${label} | ${cfg.arms.map((a) => mm[a].toFixed(3)).join(' | ')} | ${cfg.arms.filter((a) => a !== ref).map((a) => (mm[ref] - mm[a] >= 0 ? '+' : '') + (mm[ref] - mm[a]).toFixed(3)).join(' | ')} |`);
  line('corrected', m((r) => share(corrected(r))));
  line('corrected, drop W', m((r) => share(corrected(r), ['eval.no-stale-claim'])));
  line('corrected, drop searched', m((r) => share(corrected(r), ['research.searched'])));
  console.log(`  state-file-only searches: ${cfg.arms.map((a) => `${a} ${rows.filter((r) => r.group === g && r.arm === a && artefactOnly(r)).length}`).join(', ')}`);
}
