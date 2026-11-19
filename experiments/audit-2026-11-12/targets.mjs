// Audit helper: targeted listings for the suspected misread mechanisms.
// Usage: node experiments/audit-2026-11-12/targets.mjs <config> <what> [group] [arm]
//  what = paths     : every written path with the role the grader gave it, counts per arm
//         search    : trials with research.searched = false and a raw search-like command before the cut
//         failruns  : trials with failure-observed = false that ran something before the cut
//         norun     : trials with failure-observed = false and no run: Bash commands before the cut whose actions are all 'other'/unparsed
//         red       : trials with written-before-impl = true and red-before-impl = false: test runs between test write and cut
//         written   : trials with written-before-impl = false: order of the first writes
import { load, CONFIGS } from './items.mjs';
import { eventTable, fileRole } from '../../packages/pit-wall/src/graders/process/events.mjs';
import { failureSignal } from '../../packages/pit-wall/src/graders/process/phases.mjs';

const [name, what, gSel, aSel] = process.argv.slice(2);
const cfg = CONFIGS[name];
const rows = load(name).filter((r) => r.checks && r.valid && (!gSel || gSel === '-' || r.group === gSel) && (!aSel || r.arm === aSel));
const res = (r, id) => r.checks.find((c) => c.id === id)?.result;
const one = (s, L) => String(s ?? '').split('\n').join(' ⏎ ').slice(0, L);
const SEARCH_CMD = /(^|[\s;&|(])(grep|egrep|fgrep|rg|ag|ack|git\s+grep|git\s+log\s+[^|;]*-[SG])\b/;

if (what === 'paths') {
  const t = {};
  for (const r of rows) {
    const table = eventTable(r.record);
    const seenP = new Set();
    for (const e of table.events) for (const a of e.writes) {
      const k = `${r.group}/${r.cell} ${fileRole(a.path, { implFiles: r.opts.implFiles ?? [] })} ${a.path}`;
      if (seenP.has(k)) continue; seenP.add(k);
      (t[k] ??= {})[r.arm] = ((t[k] ??= {})[r.arm] ?? 0) + 1;
    }
  }
  for (const k of Object.keys(t).sort()) console.log(`${k}  ${cfg.arms.map((a) => `${a}=${t[k][a] ?? 0}`).join(' ')}`);
}
for (const r of rows) {
  const table = eventTable(r.record);
  const cut = r.facts.firstImpl ?? Infinity;
  const head = `[${r.group}/${r.cell}#${r.k} ${r.arm} cut=${r.facts.firstImpl}]`;
  if (what === 'search' && res(r, 'research.searched') === false) {
    const hits = table.events.filter((e) => e.i < cut && ((e.tool === 'Bash' && SEARCH_CMD.test(e.command)) || e.tool === 'Grep'));
    if (hits.length) { console.log(head); for (const e of hits) console.log(`   ${e.i} ${one(e.command ?? JSON.stringify(e.input), 260)}\n      acts=[${e.actions.map((a) => a.type + (a.pos < cut ? '' : '(after cut)')).join(' ')}]`); }
  }
  if (what === 'failruns' && res(r, 'research.failure-observed') === false && (r.facts.observations ?? []).length) {
    console.log(head);
    for (const o of r.facts.observations) { const e = table.events[Math.floor(o.pos)]; console.log(`   ${e.i} via=${o.via} failed=${o.failed} exit=${e.exitCode} $ ${one(e.command, 200)}\n      > ${one(e.resultText, 300)}`); }
  }
  if (what === 'norun' && res(r, 'research.failure-observed') === false && !(r.facts.observations ?? []).length) {
    const ev = table.events.filter((e) => e.i < cut && e.tool === 'Bash' && e.actions.some((a) => a.type === 'other' || a.type === 'run'));
    const c2 = table.events.filter((e) => e.i === Math.floor(cut) && e.tool === 'Bash');
    console.log(`${head} bashWithOther=${ev.length}`);
    for (const e of [...ev, ...c2]) console.log(`   ${e.i} $ ${one(e.command, 300)}\n      acts=[${e.actions.map((a) => `${a.type}${a.type === 'other' ? `:${a.name ?? ''}` : ''}${a.type === 'run' ? `:${a.target}` : ''}${a.type === 'write' ? `:${a.path}` : ''}`).join(' ')}] > ${one(e.resultText, 200)}`);
  }
  if (what === 'red' && res(r, 'test.written-before-impl') === true && res(r, 'test.red-before-impl') === false) {
    console.log(head);
    for (const e of table.events.filter((x) => x.i <= Math.min(cut, table.events.length))) {
      if (!e.actions.some((a) => a.type === 'run' || (a.type === 'write'))) continue;
      console.log(`   ${e.i} [${e.actions.filter((a) => ['run', 'write'].includes(a.type)).map((a) => (a.type === 'run' ? `${a.isTest ? 'TEST' : 'run'}:${a.target}` : `w:${fileRole(a.path)}:${a.path}`)).join(' ')}] exit=${e.exitCode} sig=${failureSignal(e.resultText) ? 'F' : '-'} $ ${one(e.command ?? e.tool, 140)}\n      > ${one(e.resultText, 260)}`);
    }
  }
  if (what === 'written' && res(r, 'test.written-before-impl') === false) {
    const ws = table.events.flatMap((e) => e.writes.map((a) => `${e.i}:${fileRole(a.path, { implFiles: r.opts.implFiles ?? [] })}:${a.path}`));
    console.log(`${head} ${ws.slice(0, 8).join('  ')}`);
  }
}
