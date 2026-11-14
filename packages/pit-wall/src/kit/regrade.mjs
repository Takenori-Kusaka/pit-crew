#!/usr/bin/env node
// Re-grade saved runs (kit/results/<role>/delta.runs.jsonl) with the current grader and specs, without
// calling a model. The case's task, kind and target are taken from the current kit/cases/<role>/evals/<case>/
// kit-case.json, so a corrected fixture applies too. "before" is the summary stored in delta.json.
// Usage: node packages/pit-wall/src/kit/regrade.mjs [--out kit/results/regrade.json] [role ...]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { grade } from './grader.mjs';

const require = createRequire(import.meta.url);
const YAML = require('yaml');
const args = process.argv.slice(2);
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'kit/results/regrade.json';
const roles = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--out');
const ROLES = roles.length ? roles : ['dev', 'po', 'qm', 'platform', 'audit', 'fix'];
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function regradeRole(role, root = '.') {
  const spec = YAML.parse(readFileSync(join(root, 'kit/roles', `${role}.yaml`), 'utf8'));
  const delta = JSON.parse(readFileSync(join(root, 'kit/results', role, 'delta.json'), 'utf8'));
  const runs = readFileSync(join(root, 'kit/results', role, 'delta.runs.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const items = runs.map((r) => {
    const kcPath = join(root, 'kit/cases', role, 'evals', r.case, 'kit-case.json');
    const kc = existsSync(kcPath) ? JSON.parse(readFileSync(kcPath, 'utf8')) : { task: r.task, kind: r.kind, target: r.target };
    const g = grade(spec, { events: r.events, state: r.state, task: kc.task, kind: kc.kind, target: kc.target });
    const old = delta.items.find((i) => i.arm === r.arm && i.case === r.case && i.trial === r.trial);
    return { arm: r.arm, case: r.case, kind: kc.kind, before: old ? { conformance: old.conformance, violations: old.violations, forbidden: old.forbidden } : null,
      after: { conformance: g.conformance, violations: g.violations, forbidden: Object.entries(g.forbidden).filter(([, v]) => v).map(([k]) => k), pass: g.pass } };
  });
  const sum = (arm) => {
    const xs = items.filter((i) => i.arm === arm);
    return { conformance: mean(xs.map((i) => i.after.conformance).filter((x) => x !== null)), violations: xs.reduce((a, i) => a + i.after.violations, 0) };
  };
  const W = sum('with'), O = sum('without');
  return {
    before: { with: delta.with.conformance, without: delta.without.conformance, delta: delta.delta, violations_with: delta.with.violations, violations_without: delta.without.violations },
    after: { with: W.conformance, without: O.conformance, delta: W.conformance - O.conformance, violations_with: W.violations, violations_without: O.violations },
    changed: items.filter((i) => !i.before || i.before.conformance !== i.after.conformance || i.before.violations !== i.after.violations),
  };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/').replace(/^([A-Za-z]):/, '/$1:')}` || process.argv[1]?.endsWith('regrade.mjs')) {
  const res = { generated_at: new Date().toISOString(), note: 'モデルを呼ばずに保存済みの記録を採点し直した。before は delta.json の値（上げる判断のケースは準拠に入っていなかった）', roles: {} };
  for (const r of ROLES) {
    res.roles[r] = regradeRole(r);
    const { before: b, after: a } = res.roles[r];
    console.log(`${r.padEnd(9)} with ${b.with.toFixed(3)} → ${a.with.toFixed(3)}  without ${b.without.toFixed(3)} → ${a.without.toFixed(3)}  Δ ${b.delta.toFixed(3)} → ${a.delta.toFixed(3)}  violations ${b.violations_with}/${b.violations_without} → ${a.violations_with}/${a.violations_without}`);
  }
  writeFileSync(out, JSON.stringify(res, null, 1) + '\n');
}
