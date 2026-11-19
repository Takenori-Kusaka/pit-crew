// Audit: every trial the tolerant signal flips (failure-observed or red-before-impl N -> Y), with
// the output of the runs before the cut, for individual reading.
// Usage: node experiments/audit-2026-11-12/flips.mjs <config>
import { load } from './items.mjs';
import { gradePhases as gradeTol } from './phases-tolerant.mjs';
import { eventTable } from '../../packages/pit-wall/src/graders/process/events.mjs';
const name = process.argv[2] ?? 'exp32';
const one = (s, L) => String(s ?? '').split('\n').join(' ⏎ ').slice(0, L);
const tally = {};
for (const r of load(name).filter((x) => x.checks && x.valid)) {
  const tol = gradeTol(r.record, { trajectory: 'T1', bug: false, base: false, ...r.opts }).checks;
  const fl = ['research.failure-observed', 'test.red-before-impl'].filter((id) => r.checks.find((c) => c.id === id)?.result === false && tol.find((c) => c.id === id)?.result === true);
  if (!fl.length) continue;
  tally[`${r.group} ${r.arm}`] = (tally[`${r.group} ${r.arm}`] ?? 0) + 1;
  const cut = r.facts.firstImpl ?? Infinity;
  console.log(`[${r.group}/${r.cell}#${r.k} ${r.arm} cut=${r.facts.firstImpl}] flips: ${fl.map((x) => x.split('.')[1]).join(', ')}`);
  const seenE = new Set();
  for (const e of eventTable(r.record).events) for (const a of e.actions) if (a.type === 'run' && a.pos < cut && !seenE.has(e.i)) { seenE.add(e.i); console.log(`   ${e.i} ${a.isTest ? 'TEST' : 'run'}:${a.target} > ${one(e.resultText, 200)}`); }
}
console.log(JSON.stringify(tally));
