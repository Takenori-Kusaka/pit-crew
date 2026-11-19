#!/usr/bin/env node
// goal 7 (card 42 §3-4): from the no-harness probe runs of each fixture, the rate at which each probe type's scene was
// done right (its `success` predicate, 3 wordings), and whether the type can tell conditions apart (0.2 <= rate <= 0.8
// on at least one fixture). Writes kit/results/dev-probe/probe.json. No model calls.
// Usage: node packages/pit-wall/src/kit/probe-summary.mjs dev-cart5 dev-invoice5
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { evaluate } from './grader.mjs';
import { cliArgs } from './cli-args.mjs';

const require = createRequire(import.meta.url);
const YAML = require('yaml');
const DIR = 'kit/results/dev-probe';
// checked before anything runs: --help prints the usage, an unknown argument stops (cli-args.mjs)
const fixtures = cliArgs(process.argv.slice(2), { min: 1,
  usage: 'usage: node packages/pit-wall/src/kit/probe-summary.mjs <fixture> ...   (e.g. dev-cart5 dev-invoice5)\n  From the no-harness probe runs of each fixture, the rate at which each probe type was done right. No model.\n  WRITES kit/results/dev-probe/probe.json (replacing it).' }).rest;
{ const missing = fixtures.filter((fx) => !existsSync(join('kit/fixtures', fx, 'fixture.yaml'))); if (missing.length) { process.stderr.write(`no such fixture: ${missing.join(', ')} (kit/fixtures/<name>/fixture.yaml)\nNothing was written.\n`); process.exit(2); } }
const out = { generated_at: new Date().toISOString(), card: 'docs/planning/42-dev-kit-probe.md', band: [0.2, 0.8], fixtures: {}, types: {} };
for (const fx of fixtures) {
  const scenes = YAML.parse(readFileSync(join('kit/fixtures', fx, 'fixture.yaml'), 'utf8')).escalation_scenes;
  const rp = join(DIR, `none-${fx}.runs.jsonl`);
  const runs = existsSync(rp) ? readFileSync(rp, 'utf8').trim().split('\n').map((l) => JSON.parse(l)) : [];
  out.fixtures[fx] = {};
  for (const s of scenes.filter((x) => x.probe_type)) {
    const rs = runs.filter((r) => JSON.parse(readFileSync(join('kit/cases', fx, 'evals', r.case, 'kit-case.json'), 'utf8')).scene === s.id);
    const ok = rs.map((r) => {
      const kc = JSON.parse(readFileSync(join('kit/cases', fx, 'evals', r.case, 'kit-case.json'), 'utf8'));
      return evaluate(kc.success, { events: r.events, state: r.state, task: kc.task, final: r.final }).hit;
    });
    const rate = ok.length ? ok.filter(Boolean).length / ok.length : null;
    out.fixtures[fx][s.probe_type] = { scene: s.id, n: ok.length, done_right: ok.filter(Boolean).length, rate };
  }
}
for (const k of ['update', 'long', 'existing']) {
  const rates = fixtures.map((fx) => out.fixtures[fx][k]?.rate).filter((x) => x !== null && x !== undefined);
  out.types[k] = { rates, informative: rates.some((r) => r >= 0.2 && r <= 0.8) };
}
writeFileSync(join(DIR, 'probe.json'), JSON.stringify(out, null, 1) + '\n');
for (const [k, v] of Object.entries(out.types)) console.log(`${k.padEnd(9)} rates ${v.rates.map((r) => r.toFixed(2)).join(' / ')}  ${v.informative ? '差を出せる' : '差を出せない'}`);
