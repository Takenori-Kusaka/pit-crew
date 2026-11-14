#!/usr/bin/env node
// goal 3: summarize the Dev evaluation (card docs/planning/38-dev-kit-evaluation.md) from
// kit/results/dev-eval/<arm>-<fixture>.json, and apply the card's §7 rule to each comparison.
// Writes kit/results/dev-eval/summary.json. No model calls.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.argv[2] ?? 'kit/results/dev-eval';
const FIXTURES = ['dev', 'dev-invoice'];
const ARMS = ['none', 'default', 'gq-copy', 'v1', 'v1.1'];
const PAIRS = [['default', 'none'], ['gq-copy', 'none'], ['v1', 'none'], ['v1', 'gq-copy'], ['v1.1', 'v1']];
const MARGIN = 0.05;
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

// --regrade (goal 4): grade every arm again from its saved runs with the current spec, so that all arms are
// counted the same way (the no-harness pilot was graded before the measure changed). The saved runs are
// `<arm>-<fixture>-pilot2.runs.jsonl` when present, else `<arm>-<fixture>.runs.jsonl`; costs come from the .json.
const REGRADE = process.argv.includes('--regrade');
let grade, spec, YAML;
if (REGRADE) {
  ({ grade } = await import('./grader.mjs'));
  YAML = (await import('node:module')).createRequire(import.meta.url)('yaml');
  spec = YAML.parse(readFileSync('kit/roles/dev.yaml', 'utf8'));
}
const items = (arm, fx) => {
  const p = join(DIR, `${arm}-${fx}.json`);
  if (!existsSync(p)) return null;
  const j = JSON.parse(readFileSync(p, 'utf8'));
  const saved = j.items.filter((i) => i.arm === (arm === 'none' ? 'without' : 'with'));
  if (!REGRADE) return saved;
  const rp = [join(DIR, `${arm}-${fx}-pilot2.runs.jsonl`), join(DIR, `${arm}-${fx}.runs.jsonl`)].find(existsSync);
  const runs = readFileSync(rp, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const cost = Object.fromEntries(saved.map((i) => [i.case, i.costUsd]));
  return runs.map((r) => {
    const kc = JSON.parse(readFileSync(join('kit/cases', fx, 'evals', r.case, 'kit-case.json'), 'utf8'));
    const g = grade(spec, { events: r.events, state: r.state, task: kc.task, kind: kc.kind, target: kc.target, final: r.final });
    return { case: r.case, kind: kc.kind, conformance: g.conformance, violations: g.violations, error: null, costUsd: cost[r.case] ?? 0,
      forbidden: Object.entries(g.forbidden).filter(([, v]) => v).map(([k]) => k), missing: Object.entries(g.required).filter(([, v]) => !v).map(([k]) => k) };
  });
};

const arms = {};
for (const arm of ARMS) {
  const by = {};
  for (const fx of FIXTURES) {
    const xs = items(arm, fx);
    if (!xs) continue;
    const byRule = {};
    for (const i of xs) for (const f of i.forbidden) byRule[f] = (byRule[f] ?? 0) + 1;
    const missing = {};
    for (const i of xs) for (const m of i.missing) missing[m] = (missing[m] ?? 0) + 1;
    by[fx] = {
      runs: xs.length, errors: xs.filter((i) => i.error).length,
      conformance: mean(xs.map((i) => i.conformance).filter((x) => x !== null)),
      violations: xs.reduce((a, i) => a + i.violations, 0), byRule, missing,
      cases: Object.fromEntries(xs.map((i) => [i.case, { conformance: i.conformance, violations: i.violations, forbidden: i.forbidden, missing: i.missing }])),
      costUsd: xs.reduce((a, i) => a + (i.costUsd ?? 0), 0),
    };
  }
  if (!Object.keys(by).length) continue;
  const all = FIXTURES.filter((f) => by[f]);
  arms[arm] = { fixtures: all, conformance: mean(all.map((f) => by[f].conformance)), violations: all.reduce((a, f) => a + by[f].violations, 0), byFixture: by };
}

// card §7
function judge(x, y) {
  if (!arms[x] || !arms[y]) return null;
  const per = FIXTURES.map((fx) => {
    const a = arms[x].byFixture[fx], b = arms[y].byFixture[fx];
    if (!a || !b) return null;
    const d = a.conformance - b.conformance;
    return { fixture: fx, diff: d, better: d >= MARGIN && a.violations <= b.violations, worse: -d >= MARGIN, violations: [a.violations, b.violations] };
  });
  if (per.some((p) => p === null)) return { pair: `${x} 対 ${y}`, state: '未測定', per };
  const nb = per.filter((p) => p.better).length, nw = per.filter((p) => p.worse).length;
  const anyUp = per.some((p) => p.diff >= MARGIN);
  const state = nb === 2 ? '成り立つ' : anyUp && nw > 0 ? '不安定' : nb === 1 ? '弱まる' : '成り立たない';
  return { pair: `${x} 対 ${y}`, state, per };
}
const claims = PAIRS.map(([x, y]) => judge(x, y)).filter(Boolean);
const out = { generated_at: new Date().toISOString(), card: 'docs/planning/38-dev-kit-evaluation.md', margin: MARGIN, note: '各ケース × 各条件 1 試行の記述', fixtures: FIXTURES, arms, claims };
writeFileSync(join(DIR, 'summary.json'), JSON.stringify(out, null, 1) + '\n');
for (const [a, v] of Object.entries(arms)) console.log(`${a.padEnd(8)} conformance ${v.conformance?.toFixed(3)}  violations ${v.violations}  ${v.fixtures.map((f) => `${f}=${v.byFixture[f].conformance.toFixed(3)}/${v.byFixture[f].violations}`).join('  ')}`);
for (const c of claims) console.log(`${c.pair.padEnd(16)} ${c.state}  ${c.per.map((p) => p ? `${p.fixture} ${p.diff >= 0 ? '+' : ''}${p.diff.toFixed(3)} v${p.violations.join('/')}` : '-').join('  ')}`);
