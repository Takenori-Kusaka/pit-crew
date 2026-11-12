// Audit of EXP-34 (job selection): the T0 cell where the whole difference sits. No code from the
// end state is executed here (the T0 rule needs none). For each arm: which sub-rule of
// "too-heavy" fires (a new file under notes/ or docs/ | a product file outside the target |
// more than 4 changed lines), and what the agent wrote into files the judge ignores (dot files,
// e.g. the default skill's own state file): count, size in lines.
// Usage: node experiments/audit-2026-11-12/jobsel-t0.mjs [cell=js-1b]
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fixtureState } from '../../packages/pit-wall/src/fixture.mjs';
import { cells, judgeSpec } from '../jobsel/cells.mjs';
import { eventTable } from '../../packages/pit-wall/src/graders/process/events.mjs';

const cell = process.argv[2] ?? 'js-1b';
const root = 'runs/2026-11-04';
const c = cells.find((x) => x.id === cell);
const s = judgeSpec[cell];
const fx = Object.fromEntries(Object.entries(fixtureState({ issue: c.params.issue, history: c.params.history })).map(([p, f]) => [p, f.text]));
const PRODUCT = /^(bin|lib|ops|scripts|config|templates|archive|data|tests|docs\/decisions)\/|^docs\/interfaces\.md$/;
const ignored = (p) => p.startsWith('.') || p.includes('/.');
const lines = (t) => String(t ?? '').split('\n').filter((l) => l.trim()).length;
function linesChanged(a = '', b = '') {
  const count = (t) => t.split('\n').reduce((m, l) => m.set(l, (m.get(l) ?? 0) + 1), new Map());
  const ca = count(a), cb = count(b); let n = 0;
  for (const k of new Set([...ca.keys(), ...cb.keys()])) n += Math.abs((ca.get(k) ?? 0) - (cb.get(k) ?? 0));
  return n;
}
console.log(`cell ${cell}: trajectory ${s.trajectory}, answer ${s.answer}`);
console.log('| arm | n | too-heavy (recomputed T0 rule) | by sub-rule: new notes/docs file / product outside target / >4 lines | new notes/docs file: median lines | wrote an ignored dot file (not .gitignore) | its median lines | calls (median) | test runs (median) |');
const med = (a) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : '-'; };
for (const arm of ['vanilla', 'v0', 'v1', 'default', 'v5']) {
  const f = join(root, `exp34-${cell}-${arm}`, 'results.json');
  if (!existsSync(f)) continue;
  const recs = JSON.parse(readFileSync(f, 'utf8')).records.filter((r) => r.trajectory && r.validity?.status !== 'invalid');
  let heavy = 0; const sub = [0, 0, 0]; const noteLines = []; let dot = 0; const dotLines = []; const calls = []; const truns = [];
  for (const r of recs) {
    const files = Object.fromEntries(Object.entries(r.state?.files ?? {}).map(([p, x]) => [p, x?.text ?? null]));
    const all = new Set([...Object.keys(fx), ...Object.keys(files)]);
    const changedAll = [...all].filter((p) => (fx[p] ?? null) !== (files[p] ?? null));
    const changed = changedAll.filter((p) => !ignored(p));
    const created = changed.filter((p) => fx[p] == null);
    const product = changed.filter((p) => PRODUCT.test(p));
    const a = created.some((p) => /^(notes|docs)\//.test(p));
    const b = product.some((p) => !s.allowed.includes(p));
    const d = product.reduce((n, p) => n + linesChanged(fx[p], files[p]), 0) > 4;
    if (a || b || d) heavy++;
    if (a) { sub[0]++; noteLines.push(created.filter((p) => /^(notes|docs)\//.test(p)).reduce((n, p) => n + lines(files[p]), 0)); }
    if (b) sub[1]++; if (d) sub[2]++;
    const dots = changedAll.filter((p) => ignored(p) && !/(^|\/)\.gitignore$/.test(p) && files[p] != null && !/^\.git\//.test(p) && !/^\.claude\//.test(p));
    if (dots.length) { dot++; dotLines.push(dots.reduce((n, p) => n + lines(files[p]), 0)); }
    const t = eventTable(r);
    calls.push(t.nCalls); truns.push(t.events.flatMap((e) => e.runs).filter((x) => x.isTest).length);
  }
  console.log(`| ${arm} | ${recs.length} | ${heavy} | ${sub.join(' / ')} | ${med(noteLines)} | ${dot} | ${med(dotLines)} | ${med(calls)} | ${med(truns)} |`);
}
