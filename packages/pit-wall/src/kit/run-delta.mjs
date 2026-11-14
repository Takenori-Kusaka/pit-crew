#!/usr/bin/env node
// Harness kit M4: run a role's generated cases with and without a harness through `claude plugin eval`,
// grade every run with the generic grader, and write the difference (Δ). The harness is an argument;
// nothing here knows which harness it is. Run inside Linux/WSL (plugin eval needs its sandbox for Bash).
// Usage: node packages/pit-wall/src/kit/run-delta.mjs --role dev --cases kit/cases/dev \
//          --harness <dir with skills/> [--entry /dev] --model claude-opus-5-5 --runs 1 --out kit/results/dev/delta.json
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import YAML from 'yaml';
import { run as pluginEval } from '../runners/claude-plugin-eval.mjs';
import { grade, fromAtif } from './grader.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const role = opt('role'), casesDir = resolve(opt('cases', `kit/cases/${role}`)), harness = opt('harness');
const entry = opt('entry', null), model = opt('model', 'claude-opus-5-5'), runs = Number(opt('runs', 1));
const out = opt('out', `kit/results/${role}/delta.json`), specPath = opt('spec', `kit/roles/${role}.yaml`);
if (!role || !harness) { console.error('usage: run-delta.mjs --role <id> --harness <dir> [--entry /cmd] [--model m] [--runs n]'); process.exit(1); }
const spec = YAML.parse(readFileSync(specPath, 'utf8'));

// gh effects from the commands the agent ran (the stand-in answers but does not tell us)
const EFFECTS = [
  [/\bgh\s+pr\s+review\b[^\n]*--approve\b/, 'pr_review_approve'], [/\bgh\s+pr\s+merge\b/, 'pr_merge'],
  [/\bgh\s+issue\s+comment\b/, 'issue_comment'], [/\bgh\s+pr\s+comment\b/, 'pr_comment'],
  [/\bgh\s+(issue|pr)\s+edit\b[^\n]*--add-label\b/, 'label_add'],
];
function stateOf(events) {
  const gh = new Set(), changed = new Set();
  for (const e of events) {
    if (e.tool === 'Bash' && e.command) for (const [re, eff] of EFFECTS) if (re.test(e.command)) gh.add(eff);
    if (['Edit', 'Write', 'NotebookEdit'].includes(e.tool) && e.path) changed.add(String(e.path).replace(/\\/g, '/').replace(/^.*?\/(?:home\/cwd|app|workspace|work)\//, ''));
  }
  return { changed: [...changed], checks_pass: null, gh: [...gh] };
}

function pluginDir(withHarness) {
  const d = mkdtempSync(join(tmpdir(), `kit-${role}-${withHarness ? 'with' : 'without'}-`));
  mkdirSync(join(d, '.claude-plugin'), { recursive: true });
  writeFileSync(join(d, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: `kit-${role}-${withHarness ? 'with' : 'without'}`, version: '0.0.1' }) + '\n');
  if (withHarness) for (const sub of ['skills', 'agents', 'commands']) if (existsSync(join(harness, sub))) cpSync(join(harness, sub), join(d, sub), { recursive: true });
  cpSync(join(casesDir, 'evals'), join(d, 'evals'), { recursive: true });
  if (withHarness && entry) for (const c of readdirSync(join(d, 'evals'))) {
    const p = join(d, 'evals', c, 'prompt.md'), t = readFileSync(p, 'utf8');
    writeFileSync(p, t.replace(/\n---\n/, `\n---\n${entry} `));
  }
  return d;
}

const arms = {};
const RUNS = [];
for (const [arm, withHarness] of [['without', false], ['with', true]]) {
  const dir = pluginDir(withHarness);
  const res = pluginEval(dir, { trials: runs, model, outJson: join(dir, 'result.json'), needsShell: true, allowTools: ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob', 'Skill', 'WebFetch'], caseGlob: opt('case', process.env.PITWALL_CASE_GLOB || undefined) });
  arms[arm] = res.records.map((r) => {
    const kc = JSON.parse(readFileSync(join(casesDir, 'evals', r.case, 'kit-case.json'), 'utf8'));
    const runRec = fromAtif(r.trajectory, {}, kc.task);
    runRec.state = stateOf(runRec.events);
    runRec.kind = kc.kind; runRec.target = kc.target;
    RUNS.push({ arm, case: r.case, trial: r.trial, ...runRec });
    const g = grade(spec, runRec);
    return { case: r.case, kind: kc.kind, trial: r.trial, error: r.error, costUsd: r.costUsd, durationSeconds: r.durationSeconds,
      calls: runRec.events.length, conformance: g.conformance, violations: g.violations, pass: g.pass,
      forbidden: Object.entries(g.forbidden).filter(([, v]) => v).map(([k]) => k),
      escalations: Object.fromEntries(Object.entries(g.escalations).filter(([, v]) => v.triggered).map(([k, v]) => [k, v.ok])),
      missing: Object.entries(g.required).filter(([, v]) => !v).map(([k]) => k),
      events: runRec.events.map((e) => `${e.tool} ${String(e.command ?? e.path ?? '').slice(0, 120)}${Number.isFinite(e.exit) ? ` [${e.exit}]` : ''}`),
      final: String(r.trajectory?.steps?.at(-1)?.message ?? '').slice(0, 400) };
  });
}
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const summary = (rs) => ({ runs: rs.length, errors: rs.filter((r) => r.error).length, conformance: mean(rs.filter((r) => r.conformance !== null).map((r) => r.conformance)), violations: rs.reduce((a, r) => a + r.violations, 0), passed: rs.filter((r) => r.pass).length, costUsd: rs.reduce((a, r) => a + (r.costUsd ?? 0), 0) });
const W = summary(arms.with), O = summary(arms.without);
const result = {
  role, model, runs, harness, entry, generated_at: new Date().toISOString(),
  note: '各ケース × 各条件 1 回の記述。統計的な主張には使わない',
  with: W, without: O,
  delta: W.conformance !== null && O.conformance !== null ? W.conformance - O.conformance : null,
  violations_delta: W.violations - O.violations,
  items: [...arms.without.map((r) => ({ arm: 'without', ...r })), ...arms.with.map((r) => ({ arm: 'with', ...r }))],
};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(result, null, 1) + '\n');
// the graded inputs, so a grader change can re-grade without new model runs
writeFileSync(out.replace(/\.json$/, '.runs.jsonl'), RUNS.map((x) => JSON.stringify(x)).join('\n') + '\n');
console.log(`${role}: conformance with ${W.conformance?.toFixed(3)} / without ${O.conformance?.toFixed(3)}  Δ ${result.delta?.toFixed(3)}  violations ${W.violations} / ${O.violations}  errors ${W.errors}/${O.errors}  cost ${(W.costUsd + O.costUsd).toFixed(2)} USD`);
