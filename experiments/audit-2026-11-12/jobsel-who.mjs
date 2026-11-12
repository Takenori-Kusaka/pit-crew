// Audit of EXP-34: for every path the judge's T0 rule counts against an arm, was it written by
// the agent (a write action in the trajectory) or is it in the end state without any write
// (i.e. it came with the arm's harness overlay)?
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fixtureState } from '../../packages/pit-wall/src/fixture.mjs';
import { cells, judgeSpec } from '../jobsel/cells.mjs';
import { eventTable } from '../../packages/pit-wall/src/graders/process/events.mjs';
const cell = process.argv[2] ?? 'js-1b'; const root = 'runs/2026-11-04';
const c = cells.find((x) => x.id === cell); const s = judgeSpec[cell];
const fx = Object.fromEntries(Object.entries(fixtureState({ issue: c.params.issue, history: c.params.history })).map(([p, f]) => [p, f.text]));
const PRODUCT = /^(bin|lib|ops|scripts|config|templates|archive|data|tests|docs\/decisions)\/|^docs\/interfaces\.md$/;
const ignored = (p) => p.startsWith('.') || p.includes('/.');
for (const arm of ['vanilla', 'v0', 'v1', 'default', 'v5']) {
  const f = join(root, `exp34-${cell}-${arm}`, 'results.json'); if (!existsSync(f)) continue;
  const recs = JSON.parse(readFileSync(f, 'utf8')).records.filter((r) => r.trajectory && r.validity?.status !== 'invalid');
  const tally = {}; let trialsOnlyOverlay = 0, trialsCounted = 0;
  for (const r of recs) {
    const files = Object.fromEntries(Object.entries(r.state?.files ?? {}).map(([p, x]) => [p, x?.text ?? null]));
    const written = new Set(eventTable(r).events.flatMap((e) => e.actions.filter((a) => a.type === 'write' || a.type === 'delete').map((a) => a.path)));
    const changed = [...new Set([...Object.keys(fx), ...Object.keys(files)])].filter((p) => !ignored(p) && (fx[p] ?? null) !== (files[p] ?? null));
    const counted = changed.filter((p) => (fx[p] == null && /^(notes|docs)\//.test(p)) || (PRODUCT.test(p) && !s.allowed.includes(p)));
    const byAgent = counted.filter((p) => written.has(p));
    if (counted.length) { trialsCounted++; if (!byAgent.length) trialsOnlyOverlay++; }
    for (const p of counted) { const k = `${written.has(p) ? 'AGENT ' : 'no-write'} ${p.split('/').slice(0, 2).join('/')}`; tally[k] = (tally[k] ?? 0) + 1; }
  }
  console.log(`\n${arm}: trials with a counted path ${trialsCounted}/${recs.length}; of these, trials where NO counted path was written by the agent: ${trialsOnlyOverlay}`);
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(`   ${v}  ${k}`);
}
