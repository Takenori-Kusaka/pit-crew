// Compact per-run view for reading a results.json: outcome, substance, validity, tools
// used (with role expansion), outward gh calls, decision record head, ADR status line.
// Usage: node experiments/summarize-run.mjs runs/<date>/<run>
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
const doc = JSON.parse(readFileSync(join(dir, 'results.json'), 'utf8'));
for (const r of doc.records) {
  const tools = (r.trajectory?.steps ?? []).flatMap((s) => (s.tool_calls ?? []).map((t) => {
    const n = t.function_name ?? t.name;
    const a = t.arguments ?? {};
    return n === 'Skill' ? `Skill(${a.skill})` : n === 'Agent' || n === 'Task' ? `${n}(${a.subagent_type ?? ''})` : n;
  }));
  const gh = (r.state?.commands?.gh ?? []).map((c) => c.slice(0, 90));
  const rec = Object.entries(r.state?.files ?? {}).filter(([p]) => p.startsWith('docs/decisions/')).map(([p, v]) => `${p}: ${(v.text ?? '').split('\n').slice(0, 3).join(' | ').slice(0, 120)}`);
  const adr = (r.state?.files?.['docs/adr/0007-cart-item-limit.md']?.text ?? '').split('\n')[1] ?? '';
  console.log(`== ${r.arm} ${r.case} #${r.trial} outcome=${r.outcome} substance=${r.substance ?? '-'} proto=${r.passedBy?.protocol} ${r.validity.status} ${JSON.stringify(r.validity.faults).slice(0, 120)}`);
  console.log(`   tools: ${tools.join(',')}`);
  if (gh.length) console.log(`   gh: ${gh.join(' ;; ')}`);
  for (const x of rec) console.log(`   rec: ${x}`);
  if (adr) console.log(`   adr: ${adr.slice(0, 120)}`);
  const failed = (r.results ?? []).filter((x) => !x.passed && !x.indicator).map((x) => `${x.name}: ${String(x.explanation).slice(0, 100)}`);
  if (failed.length) console.log(`   fail: ${failed.join(' ;; ')}`);
}
// The role expansion (`/role` at the start of the task) is not a tool call; look for it
// in the session logs.
const jobs = readdirSync(dir).filter((n) => n.endsWith('-jobs'));
let expanded = 0, sessions = 0;
for (const j of jobs) {
  for (const t of readdirSync(join(dir, j), { recursive: true })) {
    if (!String(t).endsWith('.jsonl') || !String(t).includes('projects')) continue;
    sessions++;
    if (/<command-name>\/\w+<\/command-name>/.test(readFileSync(join(dir, j, String(t)), 'utf8'))) expanded++;
  }
}
console.log(`sessions with a /role expansion: ${expanded}/${sessions}`);
const util = [];
for (const j of jobs) for (const t of readdirSync(join(dir, j), { recursive: true })) if (String(t).endsWith('claude-code.txt')) { const m = readFileSync(join(dir, j, String(t)), 'utf8').match(/"utilization":([0-9.]+)/g); if (m) util.push(m.at(-1)); }
console.log(`last seven-day utilization seen: ${util.at(-1) ?? 'n/a'}`);
