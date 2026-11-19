#!/usr/bin/env node
// goal 5 (card 40 §3-4): summarize the Dev evaluation with the primary measure = the mean, over the informative
// items fixed in kit/results/dev-eval-3/items.json (before any harness arm ran), of each item's rate in that arm.
// Secondary: all-item conformance and violations (as in goal 3/4). Every arm is graded again from its saved runs
// with the current spec. Writes kit/results/dev-eval-3/summary.json. No model calls.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { grade } from './grader.mjs';
import { itemRates } from './pilot-items.mjs';
import { cliArgs } from './cli-args.mjs';

const require = createRequire(import.meta.url);
const YAML = require('yaml');
// goal 6 reuses this with: --dir kit/results/dev-eval-4 --fixtures dev-cart4,dev-invoice4 --card docs/planning/41-dev-kit-hidden-scenes.md
const argv = process.argv.slice(2), opt = (k, d) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : d);
// checked before anything runs: --help prints the usage, an unknown argument stops (cli-args.mjs)
cliArgs(argv, { options: ['dir', 'fixtures', 'card'], max: 0,
  usage: 'usage: node packages/pit-wall/src/kit/summarize-eval3.mjs [--dir <results dir>] [--fixtures a,b] [--card <md>]\n  Summarizes the Dev evaluation over the informative items fixed in <results dir>/items.json. No model.\n  Defaults: --dir kit/results/dev-eval-3 --fixtures dev-cart3,dev-invoice3. WRITES <results dir>/summary.json (replacing it).' });
const DIR = opt('dir', 'kit/results/dev-eval-3');
const FIXTURES = opt('fixtures', 'dev-cart3,dev-invoice3').split(',');
const CARD = opt('card', 'docs/planning/40-dev-kit-power.md');
const ARMS = ['none', 'default', 'gq-copy', 'v1', 'v1.1'];
const PAIRS = [['default', 'none'], ['gq-copy', 'none'], ['v1', 'none'], ['v1', 'gq-copy'], ['v1.1', 'v1'], ['v1.1', 'none'], ['v1.1', 'gq-copy']];
const MARGIN = 0.05;
const spec = YAML.parse(readFileSync('kit/roles/dev.yaml', 'utf8'));
const items = JSON.parse(readFileSync(join(DIR, 'items.json'), 'utf8'));
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

const arms = {};
for (const arm of ARMS) {
  const by = {};
  for (const fx of FIXTURES) {
    const rp = join(DIR, `${arm}-${fx}.runs.jsonl`);
    if (!existsSync(rp)) continue;
    const informative = items.fixtures.find((x) => x.fixture === fx).informative_items;
    const rates = Object.fromEntries(itemRates(rp, join('kit/cases', fx)).items.map((x) => [x.item, x.rate]));
    const runs = readFileSync(rp, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    const graded = runs.map((r) => {
      const kc = JSON.parse(readFileSync(join('kit/cases', fx, 'evals', r.case, 'kit-case.json'), 'utf8'));
      return grade(spec, { events: r.events, state: r.state, task: kc.task, kind: kc.kind, target: kc.target, final: r.final });
    });
    const byRule = {};
    for (const g of graded) for (const [k, v] of Object.entries(g.forbidden)) if (v) byRule[k] = (byRule[k] ?? 0) + 1;
    const res = JSON.parse(readFileSync(join(DIR, `${arm}-${fx}.json`), 'utf8'));
    by[fx] = {
      primary: mean(informative.map((it) => rates[it] ?? 0)),
      item_rates: Object.fromEntries(informative.map((it) => [it, rates[it] ?? 0])),
      conformance: mean(graded.map((g) => g.conformance).filter((x) => x !== null)),
      violations: graded.reduce((a, g) => a + g.violations, 0), byRule,
      costUsd: res.items.reduce((a, i) => a + (i.costUsd ?? 0), 0),
    };
  }
  if (!Object.keys(by).length) continue;
  const fs = FIXTURES.filter((f) => by[f]);
  arms[arm] = { fixtures: fs, primary: mean(fs.map((f) => by[f].primary)), conformance: mean(fs.map((f) => by[f].conformance)), violations: fs.reduce((a, f) => a + by[f].violations, 0), byFixture: by };
}

function judge(x, y) {
  if (!arms[x] || !arms[y]) return null;
  const per = FIXTURES.map((fx) => {
    const a = arms[x].byFixture[fx], b = arms[y].byFixture[fx];
    if (!a || !b) return null;
    const d = a.primary - b.primary;
    return { fixture: fx, diff: d, better: d >= MARGIN && a.violations <= b.violations, worse: -d >= MARGIN, violations: [a.violations, b.violations] };
  });
  if (per.some((p) => p === null)) return { pair: `${x} 対 ${y}`, state: '未測定', per };
  const nb = per.filter((p) => p.better).length, nw = per.filter((p) => p.worse).length, anyUp = per.some((p) => p.diff >= MARGIN);
  const state = nb === 2 ? '成り立つ' : anyUp && nw > 0 ? '不安定' : nb === 1 ? '弱まる' : '成り立たない';
  return { pair: `${x} 対 ${y}`, state, per };
}
const claims = PAIRS.map(([x, y]) => judge(x, y)).filter(Boolean);
writeFileSync(join(DIR, 'summary.json'), JSON.stringify({ generated_at: new Date().toISOString(), card: CARD, margin: MARGIN, items: 'items.json', note: '各ケース × 各条件 1 試行の記述', fixtures: FIXTURES, arms, claims }, null, 1) + '\n');
for (const [a, v] of Object.entries(arms)) console.log(`${a.padEnd(8)} primary ${v.primary.toFixed(3)}  conformance ${v.conformance.toFixed(3)}  violations ${v.violations}  ${v.fixtures.map((f) => `${f}=${v.byFixture[f].primary.toFixed(3)}/${v.byFixture[f].violations}`).join('  ')}`);
for (const c of claims) console.log(`${c.pair.padEnd(18)} ${c.state}  ${c.per.map((p) => (p ? `${p.fixture} ${p.diff >= 0 ? '+' : ''}${p.diff.toFixed(3)} v${p.violations.join('/')}` : '-')).join('  ')}`);
