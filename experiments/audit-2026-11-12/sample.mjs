// Audit helper: fixed-seed sample of trials per arm, compact timeline per trial for hand audit.
// Usage: node experiments/audit-2026-11-12/sample.mjs <config> <group> <arm> [n=15] [--full k]
import { load, CONFIGS } from './items.mjs';
import { eventTable, fileRole } from '../../packages/pit-wall/src/graders/process/events.mjs';
import { failureSignal } from '../../packages/pit-wall/src/graders/process/phases.mjs';

const [name, group, arm] = process.argv.slice(2);
const n = Number(process.argv[5] ?? 15);
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null;
const CMD = process.argv.includes("--cmd") ? Number(process.argv[process.argv.indexOf("--cmd") + 1]) : 220;
const outLen = process.argv.includes('--out') ? Number(process.argv[process.argv.indexOf('--out') + 1]) : 160;
let seed = 20261112;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
export function pick(rows, n) {
  // spread over cells: shuffle within cell, then round-robin
  const by = {};
  for (const r of rows) (by[r.cell] ??= []).push(r);
  for (const c of Object.keys(by).sort()) { const a = by[c]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }
  const out = []; let k = 0;
  const cells = Object.keys(by).sort();
  while (out.length < n && cells.some((c) => by[c].length)) { const c = cells[k++ % cells.length]; if (by[c].length) out.push(by[c].shift()); }
  return out;
}
const one = (s, L) => String(s ?? '').split('\n').join(' ⏎ ').slice(0, L);

const all = load(name).filter((r) => r.checks && r.valid && r.group === group && r.arm === arm);
let rs = pick(all, n);
if (only) rs = all.filter((r) => only.includes(`${r.cell}#${r.k}`));
for (const r of rs) {
  const table = eventTable(r.record);
  const role = (p) => fileRole(p, { implFiles: r.opts.implFiles ?? [] });
  console.log(`\n=== ${r.cell}#${r.k} ${arm} | opts ${JSON.stringify(r.opts)} | firstImpl=${r.facts.firstImpl} changed=${r.facts.changed.join(',')}`);
  console.log(`    B: ${r.checks.filter((c) => c.series === 'B').map((c) => `${c.id.replace(/^[a-z-]+\./, '')}=${c.result === null ? 'na' : c.result ? 'Y' : 'N'}`).join(' ')}`);
  console.log(`    opened: ${JSON.stringify(r.facts.openedChanged)} claims: ${JSON.stringify(r.facts.claims.map((c) => [c.status, c.where, c.text.slice(0, 60)]))}`);
  for (const e of table.events) {
    const acts = e.actions.map((a) => `${a.type}${a.type === 'write' ? `(${role(a.path)}:${a.path})` : a.type === 'run' ? `(${a.isTest ? 'TEST' : 'run'}:${a.target})` : a.type === 'read' ? `(${a.path}:${a.range?.kind})` : a.type === 'search' ? `(${a.mode})` : a.type === 'git' ? `(${a.sub})` : ''}`).join(' ');
    const inp = e.tool === 'Bash' ? one(e.command, CMD) : one(JSON.stringify({ ...e.input, content: undefined, new_string: e.input.new_string ? one(e.input.new_string, 60) : undefined, old_string: undefined }), 200);
    console.log(` ${String(e.i).padStart(2)} ${e.tool} ${inp}\n      -> [${acts}] exit=${e.exitCode} sig=${failureSignal(e.resultText) ? 'F' : '-'} | ${one(e.resultText, outLen)}`);
  }
  console.log(`  final: ${one(table.finalMessage, 300)}`);
}
