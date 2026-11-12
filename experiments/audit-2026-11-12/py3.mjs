// Audit: trials where an agent's python3-based step failed ("python3: command not found") at or
// before the first implementation edit (environment confound, not a grader reading).
import { load, CONFIGS } from './items.mjs';
import { eventTable } from '../../packages/pit-wall/src/graders/process/events.mjs';
const rows = load('exp32').filter((r) => r.checks && r.valid);
for (const g of ['dev', 'heldout', 'd3']) console.log(g, CONFIGS.exp32.arms.map((a) => { const rs = rows.filter((r) => r.group === g && r.arm === a); const n = rs.filter((r) => { const cut = r.facts.firstImpl ?? Infinity; return eventTable(r.record).events.some((e) => e.i <= cut && /python3: command not found/.test(e.resultText)); }).length; return `${a} ${n}/${rs.length}`; }).join(', '));
