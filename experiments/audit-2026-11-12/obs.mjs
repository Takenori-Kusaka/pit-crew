// Audit helper: what satisfied research.failure-observed. For each trial where it is true, print
// the satisfying run (via, generic command head, whether the output carries a failure signal).
// Summary: per arm, how many 'program' observations have a failure signal in the output, and
// what the program target is (role of the target file).
// Usage: node experiments/audit-2026-11-12/obs.mjs <config> [--show N]
import { load, CONFIGS } from './items.mjs';
import { eventTable, fileRole } from '../../packages/pit-wall/src/graders/process/events.mjs';
import { failureSignal } from '../../packages/pit-wall/src/graders/process/phases.mjs';

const name = process.argv[2] ?? 'exp32';
const show = process.argv.includes('--show') ? Number(process.argv[process.argv.indexOf('--show') + 1]) : 0;
const rows = load(name).filter((r) => r.checks && r.valid);
const cfg = CONFIGS[name];
for (const g of Object.keys(cfg.groups)) {
  console.log(`\n## ${name} ${g}: what satisfied failure-observed`);
  for (const a of cfg.arms) {
    const rs = rows.filter((r) => r.group === g && r.arm === a);
    const tally = {};
    const samples = [];
    for (const r of rs) {
      const fo = r.facts.failureObserved;
      if (!fo) continue;
      const table = eventTable(r.record);
      const ev = table.events[Math.floor(fo.pos)];
      const act = ev.actions.find((x) => x.pos === fo.pos);
      const sig = failureSignal(ev.resultText);
      const role = act?.target == null ? 'null' : fileRole(act.target, { implFiles: r.opts.implFiles ?? [] });
      // any later-or-equal observation before the cut that is a test/repro with a failure signal?
      const strict = (r.facts.observations ?? []).some((o) => o.failed);
      const key = `${fo.via} target=${role} signal=${sig ? 'Y' : 'n'} anyFailedRunBeforeCut=${strict ? 'Y' : 'n'}`;
      tally[key] = (tally[key] ?? 0) + 1;
      samples.push({ cell: r.cell, k: r.k, key, cmd: (ev.command ?? ev.tool).slice(0, 160).split('\n').join(' ⏎ '), out: ev.resultText.slice(0, 200).split('\n').join(' ⏎ ') });
    }
    console.log(`\n${a} (n=${rs.length})`);
    for (const [k, v] of Object.entries(tally).sort((x, y) => y[1] - x[1])) console.log(`  ${v}  ${k}`);
    for (const s of samples.slice(0, show)) console.log(`    [${s.cell}#${s.k}] ${s.key}\n      $ ${s.cmd}\n      > ${s.out}`);
  }
}
