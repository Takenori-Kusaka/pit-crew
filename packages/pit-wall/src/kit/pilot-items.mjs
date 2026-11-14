#!/usr/bin/env node
// goal 4, card 39 §2: from a no-harness pilot (delta.runs.jsonl of each fixture), the rate at which each item is
// satisfied, and which items are informative (0.2 <= rate <= 0.8). Items: required actions and order pairs (over the
// non-escalation cases), forbidden rules (not done, over all cases), escalation rows (raised, over that scene's cases).
// Usage: node packages/pit-wall/src/kit/pilot-items.mjs <fixture>=<runs.jsonl> ... [--out kit/results/dev-eval-2/pilot.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { grade } from './grader.mjs';

const require = createRequire(import.meta.url);
const YAML = require('yaml');
const args = process.argv.slice(2);
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'kit/results/dev-eval-2/pilot.json';
const spec = YAML.parse(readFileSync('kit/roles/dev.yaml', 'utf8'));
const LO = 0.2, HI = 0.8;

export function itemRates(runsPath, casesDir) {
  const runs = readFileSync(runsPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const tally = {};
  const add = (k, ok) => { tally[k] ??= { ok: 0, n: 0 }; tally[k].n += 1; if (ok) tally[k].ok += 1; };
  for (const r of runs) {
    const kc = JSON.parse(readFileSync(join(casesDir, 'evals', r.case, 'kit-case.json'), 'utf8'));
    const g = grade(spec, { events: r.events, state: r.state, task: kc.task, kind: kc.kind, target: kc.target, final: r.final });
    if (kc.kind !== 'escalation') {
      for (const [id, ok] of Object.entries(g.required)) add(`required:${id}`, ok);
      for (const o of g.order) if (o.ok !== null) add(`order:${o.before}→${o.after}`, o.ok);
    }
    for (const [id, hit] of Object.entries(g.forbidden)) add(`forbidden-avoided:${id}`, !hit);
    if (kc.kind === 'escalation') add(`escalation:${kc.target}`, g.escalations[kc.target]?.escalated === true);
  }
  const items = Object.entries(tally).map(([item, t]) => ({ item, rate: t.ok / t.n, n: t.n }));
  return { items, informative_items: items.filter((x) => x.rate >= LO && x.rate <= HI).map((x) => x.item) };
}

if (process.argv[1]?.endsWith('pilot-items.mjs')) {
  const fixtures = [];
  for (const a of args.filter((x, i) => x.includes('=') && args[i - 1] !== '--out')) {
    const [fixture, runsPath] = a.split('=');
    const casesDir = fixture === 'dev' ? 'kit/cases/dev' : `kit/cases/${fixture}`;
    const r = itemRates(runsPath, casesDir);
    fixtures.push({ fixture, runs: runsPath, ...r });
    console.log(`${fixture}: informative ${r.informative_items.length} — ${r.informative_items.join(', ')}`);
    for (const x of r.items) console.log(`   ${x.rate.toFixed(2)} (${x.n})  ${x.item}`);
  }
  writeFileSync(out, JSON.stringify({ generated_at: new Date().toISOString(), card: 'docs/planning/39-dev-kit-cases-v2.md', band: [LO, HI], fixtures }, null, 1) + '\n');
}
