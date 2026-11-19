#!/usr/bin/env node
// Re-grade saved runs (kit/results/<role>/delta.runs.jsonl) with the current grader and specs, without
// calling a model. The case's task, kind and target are taken from the current kit/cases/<role>/evals/<case>/
// kit-case.json, so a corrected fixture applies too. "before" is the summary stored in delta.json.
// Usage: node packages/pit-wall/src/kit/regrade.mjs [--out kit/results/regrade.json] [role ...]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { grade } from './grader.mjs';
import { cliArgs } from './cli-args.mjs';

const require = createRequire(import.meta.url);
const YAML = require('yaml');
const MAIN = !!process.argv[1] && (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/').replace(/^([A-Za-z]):/, '/$1:')}` || process.argv[1].endsWith('regrade.mjs'));
// checked before anything runs: --help prints the usage, an unknown argument stops (cli-args.mjs)
const cli = MAIN ? cliArgs(process.argv.slice(2), { options: ['out'],
  usage: 'usage: node packages/pit-wall/src/kit/regrade.mjs [--out <json>] [role ...]\n  Grades the saved runs (kit/results/<role>/delta.runs.jsonl) again with the current grader and specs. No model.\n  Roles: dev po qm platform audit fix (default: all).\n  WRITES the result to --out (default kit/results/regrade.json, replacing it).' }) : { options: {}, rest: [] };
const out = cli.options.out ?? 'kit/results/regrade.json';
const roles = cli.rest;
const ROLES = roles.length ? roles : ['dev', 'po', 'qm', 'platform', 'audit', 'fix'];
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

// The run to grade, rebuilt from a saved record. `old` is the record's row in delta.json (may be absent).
// - task / kind / target: the case as generated now; when the case no longer exists (renamed later), what
//   the record and its delta.json row carry
// - final: the whole last message when the record kept it (run-delta.mjs does since goal 4); otherwise the
//   copy in delta.json, which was cut at FINAL_CUT characters — marked `final_truncated`, so that "no match
//   in the kept part" is graded undecidable, not "did not say it" (W3, #100)
export const FINAL_CUT = 400;
export function savedRun(role, r, old, root = '.') {
  const kcPath = join(root, 'kit/cases', role, 'evals', r.case, 'kit-case.json');
  const kc = existsSync(kcPath) ? JSON.parse(readFileSync(kcPath, 'utf8')) : null;
  const kind = kc?.kind ?? r.kind ?? old?.kind ?? null;
  const target = kc ? kc.target : r.target ?? (kind === 'escalation' ? Object.keys(old?.escalations ?? {})[0] ?? null : null);
  const whole = typeof r.final === 'string';
  const final = whole ? r.final : typeof old?.final === 'string' ? old.final : undefined;
  return { events: r.events, state: r.state, task: kc?.task ?? r.task, kind, target, final, final_truncated: !whole && typeof final === 'string' && final.length >= FINAL_CUT };
}

export function regradeRole(role, root = '.') {
  const spec = YAML.parse(readFileSync(join(root, 'kit/roles', `${role}.yaml`), 'utf8'));
  const delta = JSON.parse(readFileSync(join(root, 'kit/results', role, 'delta.json'), 'utf8'));
  const runs = readFileSync(join(root, 'kit/results', role, 'delta.runs.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const items = runs.map((r) => {
    const old = delta.items.find((i) => i.arm === r.arm && i.case === r.case && i.trial === r.trial);
    const run = savedRun(role, r, old, root);
    const g = grade(spec, run);
    return { arm: r.arm, case: r.case, kind: run.kind,
      before: old ? { conformance: old.conformance, violations: old.violations, forbidden: old.forbidden, escalations: old.escalations, pass: old.pass } : null,
      after: { conformance: g.conformance, violations: g.violations, forbidden: Object.entries(g.forbidden).filter(([, v]) => v === true).map(([k]) => k),
        escalations: Object.fromEntries(Object.entries(g.escalations).filter(([, x]) => x.triggered).map(([k, x]) => [k, x.ok])),
        undecidable: g.undecidable, outcome: g.outcome, pass: g.pass } };
  });
  // undecidable is counted on its own: `violations` holds definite violations only, `pass` definite passes only
  const sum = (arm) => {
    const xs = items.filter((i) => i.arm === arm);
    const n = (o) => xs.filter((i) => i.after.outcome === o).length;
    return { conformance: mean(xs.map((i) => i.after.conformance).filter((x) => x !== null)), violations: xs.reduce((a, i) => a + i.after.violations, 0),
      trials: xs.length, pass: n('pass'), fail: n('fail'), undecidable: n('undecidable'), undecidable_rows: xs.reduce((a, i) => a + i.after.undecidable.length, 0) };
  };
  const W = sum('with'), O = sum('without');
  return {
    before: { with: delta.with.conformance, without: delta.without.conformance, delta: delta.delta, violations_with: delta.with.violations, violations_without: delta.without.violations },
    after: { with: W.conformance, without: O.conformance, delta: W.conformance !== null && O.conformance !== null ? W.conformance - O.conformance : null, violations_with: W.violations, violations_without: O.violations,
      outcomes_with: { trials: W.trials, pass: W.pass, fail: W.fail, undecidable: W.undecidable }, outcomes_without: { trials: O.trials, pass: O.pass, fail: O.fail, undecidable: O.undecidable },
      undecidable_rows_with: W.undecidable_rows, undecidable_rows_without: O.undecidable_rows },
    changed: items.filter((i) => !i.before || i.before.conformance !== i.after.conformance || i.before.violations !== i.after.violations || i.after.undecidable.length > 0),
    items,
  };
}

if (MAIN) {
  const known = ['dev', 'po', 'qm', 'platform', 'audit', 'fix'];
  const bad = ROLES.filter((r) => !known.includes(r) && !existsSync(join('kit/results', r, 'delta.runs.jsonl')));
  if (bad.length) { process.stderr.write(`no saved runs for: ${bad.join(', ')} (kit/results/<role>/delta.runs.jsonl)\nNothing was written.\n`); process.exit(2); }
  const res = { generated_at: new Date().toISOString(), note: 'モデルを呼ばずに保存済みの記録を採点し直した。before は delta.json の値（上げる判断のケースは準拠に入っていなかった）。判定不能（undecidable）は、違反にも合格にも数えず、別の数として出す', roles: {} };
  const f = (x) => (x === null ? ' n/a ' : x.toFixed(3));
  for (const r of ROLES) {
    res.roles[r] = regradeRole(r);
    const { before: b, after: a } = res.roles[r];
    const o = (x) => `pass ${x.pass} / fail ${x.fail} / undecidable ${x.undecidable} of ${x.trials}`;
    console.log(`${r.padEnd(9)} with ${f(b.with)} → ${f(a.with)}  without ${f(b.without)} → ${f(a.without)}  Δ ${f(b.delta)} → ${f(a.delta)}  violations ${b.violations_with}/${b.violations_without} → ${a.violations_with}/${a.violations_without}  with: ${o(a.outcomes_with)}  without: ${o(a.outcomes_without)}  undecidable rows ${a.undecidable_rows_with}/${a.undecidable_rows_without}`);
  }
  writeFileSync(out, JSON.stringify(res, null, 1) + '\n');
}
