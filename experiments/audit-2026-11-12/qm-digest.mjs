// Auditor digest of one stored trial: calls in order (truncated), the cut, the grader's item results, gh end state.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const [exp, cell, arm, k, w = '300', rw = '200'] = process.argv.slice(2);
const rows = JSON.parse(readFileSync('experiments/audit-2026-11-12/qm-regrade.json', 'utf8'));
const row = rows.find((r) => r.exp === exp && r.cell === cell && r.arm === arm && r.k === Number(k));
const R = JSON.parse(readFileSync(join('runs/2026-11-05', `${exp}-${cell}-${arm}`, 'results.json'), 'utf8')).records[Number(k)];
console.log(`# ${exp} ${cell} ${arm} #${k} valid=${row.valid} ok=${row.ok} harm=${row.harm} cut=${row.facts.firstJudgement}`);
console.log('checks:', Object.entries(row.checks).map(([id, v]) => `${id.replace(/^review\./, '')}=${v === null ? 'null' : v ? 'T' : 'F'}`).join(' '));
let i = 0;
for (const s of R.trajectory.steps ?? []) {
  if (s.message && String(s.message).trim()) console.log(`  [msg] ${String(s.message).slice(0, Number(rw)).replace(/\n/g, ' ⏎ ')}`);
  for (const c of s.tool_calls ?? []) {
    const inp = c.arguments ?? c.input ?? {}; const name = c.function_name ?? c.name;
    const txt = name === 'Bash' ? inp.command : JSON.stringify(inp);
    console.log(`${i}: ${name} ${String(txt).slice(0, Number(w)).replace(/\n/g, ' ⏎ ')}`);
    console.log(`     => ${String(c.extra?.result?.text ?? '').slice(0, Number(rw)).replace(/\n/g, ' ⏎ ')}`);
    i++;
  }
}
console.log('[final]', String(R.trajectory.final_message ?? '').slice(0, 600).replace(/\n/g, ' ⏎ '));
const gh = R.state.gh; console.log('[gh items]', JSON.stringify(Object.fromEntries(Object.entries(gh.items ?? {}).map(([n, it]) => [n, { ...it, reviews: (it.reviews ?? []).map((r) => ({ event: r.event, by: r.by, body: String(r.body ?? '').slice(0, 300) })), comments: (it.comments ?? []).map((c) => String(c).slice(0, 300)) }]))));
