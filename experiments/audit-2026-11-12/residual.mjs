// Audit: trials where red-before-impl or failure-observed stays N under the tolerant signal
// although a run happened before the cut (position-wise). Printed for hand classification.
// Usage: node experiments/audit-2026-11-12/residual.mjs <config>
import { load, CONFIGS } from './items.mjs';
import { gradePhases as gradeTol, phaseFacts } from './phases-tolerant.mjs';
import { eventTable } from '../../packages/pit-wall/src/graders/process/events.mjs';

const name = process.argv[2] ?? 'exp32';
const rows = load(name).filter((r) => r.checks && r.valid);
const one = (s, L) => String(s ?? '').split('\n').join(' ⏎ ').slice(0, L);
const tally = {};
for (const r of rows) {
  const o = { trajectory: 'T1', bug: false, base: false, ...r.opts };
  const tol = gradeTol(r.record, o).checks;
  const get = (cs, id) => cs.find((c) => c.id === id)?.result;
  const redN = get(tol, 'test.red-before-impl') === false, foN = get(tol, 'research.failure-observed') === false;
  if (!redN && !foN) continue;
  const table = eventTable(r.record);
  const cut = r.facts.firstImpl ?? Infinity;
  const runs = table.events.flatMap((e) => e.actions.filter((a) => a.type === 'run' && a.pos < cut).map((a) => ({ e, a })));
  const key = `${r.group} ${r.arm}`;
  const t = (tally[key] ??= { stillN: 0, withRun: 0 });
  t.stillN++;
  if (!runs.length) continue;
  t.withRun++;
  console.log(`[${r.group}/${r.cell}#${r.k} ${r.arm} cut=${r.facts.firstImpl}] red=${redN ? 'N' : 'ok'} fo=${foN ? 'N' : 'ok'} written=${get(tol, 'test.written-before-impl')}`);
  const seenE = new Set();
  for (const { e, a } of runs) { if (seenE.has(e.i)) continue; seenE.add(e.i); console.log(`   ${e.i} ${a.isTest ? 'TEST' : 'run'}:${a.target} exit=${e.exitCode} > ${one(e.resultText, 240)}`); }
}
console.log(JSON.stringify(tally));
