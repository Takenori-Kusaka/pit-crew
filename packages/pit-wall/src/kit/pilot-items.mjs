#!/usr/bin/env node
// goal 4, card 39 §2: from a no-harness pilot (delta.runs.jsonl of each fixture), the rate at which each item is
// satisfied, and which items are informative (0.2 <= rate <= 0.8). Items: required actions and order pairs (over the
// non-escalation cases), forbidden rules (not done, over all cases), escalation rows (raised, over that scene's cases).
// Usage: node packages/pit-wall/src/kit/pilot-items.mjs <fixture>=<runs.jsonl> ... [--out kit/results/dev-eval-2/pilot.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { grade, evaluate } from './grader.mjs';
import { cliArgs } from './cli-args.mjs';

const require = createRequire(import.meta.url);
const YAML = require('yaml');
const MAIN = !!process.argv[1]?.endsWith('pilot-items.mjs');
// checked before anything runs: --help prints the usage, an unknown argument stops (cli-args.mjs)
const cli = MAIN ? cliArgs(process.argv.slice(2), { options: ['out'], min: 1,
  usage: 'usage: node packages/pit-wall/src/kit/pilot-items.mjs <fixture>=<runs.jsonl> ... [--out <json>]\n  From a no-harness pilot, the rate at which each item is satisfied. No model.\n  WRITES the result to --out (default kit/results/dev-eval-2/pilot.json, replacing it).' }) : { options: {}, rest: [] };
const args = cli.rest;
const out = cli.options.out ?? 'kit/results/dev-eval-2/pilot.json';
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
    if (kc.kind === 'escalation') add(`escalation:${kc.scene ?? kc.target}`, g.escalations[kc.target]?.escalated === true);   // goal 5: one item per scene
    // goal 6 (card 41 §3): a convention scene succeeds when its own predicate matches; a proceed scene when it did not over-escalate
    if (kc.kind === 'scene' && kc.scene_type === 'convention') add(`convention:${kc.scene}`, evaluate(kc.success, { events: r.events, state: r.state, task: kc.task, final: r.final }).hit);
    if (kc.kind === 'scene' && kc.scene_type === 'proceed') add(`proceed:${kc.scene}`, g.forbidden['over-escalate'] !== true);
  }
  const items = Object.entries(tally).map(([item, t]) => ({ item, rate: t.ok / t.n, n: t.n }));
  return { items, informative_items: items.filter((x) => x.rate >= LO && x.rate <= HI).map((x) => x.item) };
}

if (MAIN) {
  const fixtures = [];
  const bad = args.filter((x) => !/^[^=]+=.+$/.test(x));
  if (bad.length) { process.stderr.write(`not <fixture>=<runs.jsonl>: ${bad.join(', ')}\nNothing was written.\n`); process.exit(2); }
  for (const a of args) {
    const [fixture, runsPath] = a.split('=');
    const casesDir = fixture === 'dev' ? 'kit/cases/dev' : `kit/cases/${fixture}`;
    const r = itemRates(runsPath, casesDir);
    fixtures.push({ fixture, runs: runsPath, ...r });
    console.log(`${fixture}: informative ${r.informative_items.length} — ${r.informative_items.join(', ')}`);
    for (const x of r.items) console.log(`   ${x.rate.toFixed(2)} (${x.n})  ${x.item}`);
  }
  writeFileSync(out, JSON.stringify({ generated_at: new Date().toISOString(), card: 'docs/planning/39-dev-kit-cases-v2.md', band: [LO, HI], fixtures }, null, 1) + '\n');
}
