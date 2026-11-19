#!/usr/bin/env node
// The release gate in one command (W4 #98, plan 48 §4, rules: kit/release-rules.json).
//
//   node scripts/release-gate.mjs <role>                    the whole gate (docker / Harbor, Linux or WSL)
//   node scripts/release-gate.mjs <role> --plan             what would run; no docker, no model
//   node scripts/release-gate.mjs <role> --grade-only <dir> grade a run directory from its saved records
//
// Steps: (1) the role's cases as Harbor tasks (2) the grader's self-check on scripted controls (3) the trials:
// with and without the harness, one container at a time, with a memory guard and the quota guard before each
// (4) grading from the saved records (5) the gate verdict, the per-case status words and the numbered run record.
// (3) is the only step that needs docker and a model. A run that a guard stops can be started again with the
// same command and `--run-dir <dir>`: finished trials are kept, none is run twice.
//
// Options
//   --fixtures a,b        fixture directories (default: the table's `fixtures`; without a table, kit/fixtures/<role>-basic)
//   --table <json>        the contract-case table (default kit/contract/<role>.json when it exists; without one,
//                         every case is a rule case and the run is provisional). A table with `rows` is read by rows:
//                         a run is planned when one of its rows is in the gate; every other row is listed as outside
//                         the gate with its reason and is not planned (packages/pit-wall/src/kit/release-gate.mjs).
//                         Rules v6 §1.5: the compliance of a run is the checks its compliance / evidence rows in the
//                         gate name; a run in the gate with none stops the command (exit 2) before any trial, and so
//                         does an action excluded in runs[].not_applicable without a reason. The number of excluded
//                         actions is printed per run and in total, and written to the run record
//   --harness <dir>       the harness under test (default: the role's own, see HARNESS below)   --entry </cmd>
//   --model <id>          default claude-fable-5-2 (fixed by the owner; another id is recorded as such)
//   --phases gate,headline | screen | probe   default gate,headline. screen = the headline screening (without the
//                         harness, 3 trials; rows in the gate marked `screen` / `headline_candidate` in the table, or all
//                         selected cases when there is no table). probe = `--probe-trials <n>` trials without the harness (W0c), on
//                         every selected case of the fixtures (the contract table is read only when --table is given).
//                         Neither is a gate run: no number in the ledger, and `--run-dir` is required.
//   --cases <regex>       only the cases whose id matches (a partial run can never pass the gate)
//   --previous <verdict.json>           the previous version's verdict (a case that passed there must pass here)
//   --run-dir <dir>       resume this run directory        --controls-trials <n>  default 1
//   --min-free-gib <n>    default 6                        --skip-docker-controls (recorded; the run is provisional)
//   --regrade-with-current   with --grade-only: grade although the files differ from the recorded digests (below)
//   --controls-only       only the scripted controls in docker: no model trial is planned or run. The table and the
//                         fixtures are read as for the gate (the same checks before any trial, the same plan lines and
//                         digests in run.json), but it is not a gate run: no number in the ledger, no run record. Output
//                         in --run-dir (default runs/controls/<role>-<UTC time>/), laid out as a gate run directory; its
//                         verdict is 「対照だけ。門の結果ではない」. Exit 0 when every control is graded as built, 1 when one is not.
//
// What a run is fixed on (kit/release-rules.json `change_rule`, kit/release-rules.md §1.5; kit/schema/trial-record.md §9).
// Before the first trial (the scripted controls included) run.json gets `digests`: the sha256 of the contract table
// that is read, kit/release-rules.json, the role spec, every fixture.yaml of the run, the grader's sources, the gate's
// own sources, and the harness version (tree id, commit, dirty flag). A run is not started (exit 2, with the list)
// while one of these files has uncommitted changes, is untracked or lies outside the repository: every digest must be
// the content of a commit. A probe does not read the contract table, so the table is not among its files.
// Before every trial, when a run is resumed, and whenever a run directory is graded, the files now are compared with
// the recorded digests. When they differ:
//   during a run     the run stops before the next trial; it cannot be resumed (exit 2: start a new run)
//   grading          nothing is graded. The output says 「記録の時点と違う版で採点した」, lists what differs, and the
//                    verdict is `not_a_gate_result` (exit 3). No sentence for a public text is produced.
//   --grade-only <dir> --regrade-with-current   the deliberate re-grade for analysis: graded with the files as they
//                    are now; the mark is above every table and in verdict.json, the verdict stays not_a_gate_result
// A grading whose digests do not match is written under <run dir>/regrade/; the run's own verdict files are not touched.
// Exit codes: 0 gate passed (or a screen / probe run finished) | 1 gate failed or provisional | 2 refused before any
// trial | 3 not a gate result (digests differ) | 4 stopped by a guard (start again with --run-dir)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cliArgs } from '../packages/pit-wall/src/kit/cli-args.mjs';
import { scrubHome } from '../packages/pit-wall/src/kit/scrub-home.mjs';
import { simulatedControls } from '../packages/pit-wall/src/kit/harbor-cases.mjs';
import { MARK, noGateRunLine, planTrials, renderNotAGateResult, restrictTable, tableProblems, tableSummary, tableUnits } from '../packages/pit-wall/src/kit/release-gate.mjs';
import { MODEL, allocateRun, checkKnown, checkRead, closeRun, compareDigests, digestOfDigests, simulatedControlWhy, defaultTable, gradeRunDir, graderCommit, guard, harnessVersion, loadCases, readLedger, rulesDigest, runDigests, runTrial, trialFile, uncommitted, writeGrading } from '../packages/pit-wall/src/kit/gate-run.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// the harness each role is released with (docs/kit-guide.md); --harness / --entry replace it
const HARNESS = { dev: ['subjects/dev-skill-default', '/dev'], qm: ['subjects/qm-skill-default', '/qm-review'], fix: ['subjects/fix-skill-default', '/fix'] };
const argv = process.argv.slice(2);
const flag = (k) => argv.includes(`--${k}`);
const opt = (k, d = undefined) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const VALUED = ['probe-trials', 'fixtures', 'table', 'harness', 'entry', 'model', 'phases', 'cases', 'previous', 'run-dir', 'controls-trials', 'min-free-gib', 'grade-only'];
const USAGE = 'usage: node scripts/release-gate.mjs <role> [--plan | --grade-only <run dir>] [--fixtures a,b] [--cases <id prefix,...>] [--table f] [--harness dir --entry /cmd] [--model m]\n         [--phases gate,headline|screen|probe] [--probe-trials n] [--controls-trials n] [--previous verdict.json] [--run-dir dir] [--min-free-gib n] [--skip-docker-controls] [--regrade-with-current] [--controls-only]\n  --plan prints what would run (no docker, no model, writes nothing). --grade-only grades saved records (no model; writes verdict files in the run directory).\n  Without either, it RUNS the scripted controls in docker and the model trials (uses model quota) and writes the run directory, the ledger and the run record.';
// checked before anything runs: --help prints the usage, an unknown argument stops (cli-args.mjs)
cliArgs(argv, { flags: ['plan', 'regrade-with-current', 'skip-docker-controls', 'controls-only'], options: VALUED, max: 1, usage: USAGE });
const role = argv.find((a, i) => !a.startsWith('--') && !VALUED.includes(argv[i - 1]?.replace(/^--/, '')));
const say = (s) => process.stdout.write(`${s}\n`);
const json = (p) => JSON.parse(readFileSync(p, 'utf8'));
const put = (p, v) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, `${JSON.stringify(scrubHome(v), null, 1)}\n`); };   // no local home path in what is written
if (!role) { process.stderr.write(`missing argument: <role>\n${USAGE}\nNothing was run.\n`); process.exit(2); }

const rules = json(join(ROOT, 'kit/release-rules.json'));
const previous = opt('previous') ? json(resolve(opt('previous'))) : null;

const short = (h) => (h ? String(h).slice(0, 12) : 'none');
const diffLine = (d) => `${d.kind}: ${d.what ?? `${d.path ?? d.recorded_path} (recorded ${short(d.recorded)} -> now ${short(d.now)})`}`;
function finish(runDir, table, tablePath, regrade = false) {
  const r = gradeRunDir({ root: ROOT, runDir, rules, table, tablePath, previous, regrade });
  const out = writeGrading(runDir, r);
  const nag = r.verdict.gate === 'not_a_gate_result';
  if ((r.run.phases ?? ['gate']).includes('gate')) say(r.text);
  else {
    // a screen / probe run: counts only, no gate verdict
    if (nag) say(renderNotAGateResult(r.verdict, { role: r.run.role, run: r.run.run }));
    const byCase = {};
    for (const t of r.graded) (byCase[`${t.phase} ${t.case}`] ??= []).push(t);
    // a count is followed by the names it counts and their number of trials: " (harm:x 3, forbidden:y 1)"
    for (const [k, ts] of Object.entries(byCase)) say(`${nag ? `[${MARK}] ` : ''}${noGateRunLine(k, ts)}`);
  }
  for (const c of r.controls.filter((c) => !c.ok)) say(`CONTROL NOT AS BUILT: ${c.case} ${c.control} t${c.trial}: ${c.why}`);
  for (const s of r.screen) say(`${nag ? `[${MARK}] ` : ''}screen ${s.id}${s.run && s.run !== s.id ? ` (run ${s.run})` : ''} [${[].concat(s.fail_on).join(', ')}]: ${s.fail}/${s.n} failed without the harness -> ${s.advance === null ? 'incomplete' : s.advance ? 'advances to the headline trials' : 'does not advance'} (not counted in the headline trials)`);
  if (nag) say(`NOT A GATE RESULT — ${MARK}: ${r.digest_check.differences.map(diffLine).join('; ')}. Written under ${relative(ROOT, out).replace(/\\/g, '/') || out} (the run's own verdict files are not touched)${r.digest_check.regraded_with_current ? '' : '. Nothing was graded; --grade-only <dir> --regrade-with-current grades it for analysis (marked)'}`);
  return r;
}

// ---- grade only ---------------------------------------------------------------------------------------------
if (opt('grade-only')) {
  const runDir = resolve(opt('grade-only'));
  const run = json(join(runDir, 'run.json'));
  if (run.role !== role) { process.stderr.write(`the run directory is for role ${run.role}\n`); process.exit(2); }
  const r = finish(runDir, null, opt('table') ?? run.table ?? null, flag('regrade-with-current'));
  process.exit(r.verdict.gate === 'pass' ? 0 : r.verdict.gate === 'not_a_gate_result' ? 3 : 1);
}

// ---- cases, table, self-check without a container ---------------------------------------------------------
// --controls-only: the table and fixtures are read as for a gate run (phases gate,headline below), but no model trial is
// planned, and the run directory records the phase `controls` only (graded as a run that is not a gate run)
const controlsOnly = flag('controls-only');
if (controlsOnly && (opt('phases') || flag('skip-docker-controls'))) { process.stderr.write('--controls-only runs the scripted controls only: it takes no --phases and no --skip-docker-controls\nNothing was run.\n'); process.exit(2); }
const phases = (opt('phases') ?? 'gate,headline').split(',');
// A probe (W0c) explores the cases of the fixtures it is given; it is not a contract run. Without --table it does
// not read the role's contract table (whose runs may come from other fixtures, and which names one wording per scene).
const probeOnly = phases.every((x) => x === 'probe');
const tablePath = opt('table') ?? (!probeOnly && existsSync(join(ROOT, 'kit/contract', `${role}.json`)) ? `kit/contract/${role}.json` : null);
const tableFile = tablePath ? json(resolve(ROOT, tablePath)) : null;
// the fixtures: --fixtures, else the ones the table names (its `fixtures`), else the role's basic one
const fixtures = (opt('fixtures')?.split(',') ?? (Array.isArray(tableFile?.fixtures) && tableFile.fixtures.length ? tableFile.fixtures : [`kit/fixtures/${role}-basic`])).map((f) => relative(ROOT, resolve(ROOT, f)).replace(/\\/g, '/'));
const { spec, cases, byId } = loadCases(ROOT, role, fixtures);
let table = tableFile ?? defaultTable(cases);
// only the runs that have a row in the gate are made; a row outside the gate may name a run no fixture makes yet
const missing = tableUnits(table).units.filter((u) => u.gated && !byId[u.id]).map((u) => u.id);
if (missing.length) { process.stderr.write(`the table puts runs in the gate that the fixtures do not make: ${missing.join(', ')} (a row that cannot run yet stays in the table with gate: false and a gate_reason)\n`); process.exit(2); }
// a row in the gate whose check the grader will not read for its run (the fixture does not pass the value, the
// name is not a row of the role spec): the table says it is measured, and it is not. Stop before any trial.
const notRead = tableUnits(table).units.filter((u) => u.gated).flatMap((u) => u.gateRows.flatMap((r) => [].concat(r.checks ?? []).filter((c) => !checkRead(spec, byId[u.id], c)).map((c) => `${r.id} (run ${u.id}): ${c}`)));
if (notRead.length) { process.stderr.write(`rows in the gate name checks that are not read for their run:\n${notRead.map((x) => `  ${x}`).join('\n')}\nput the row outside the gate (gate: false and a gate_reason), or make the fixture pass the value the check needs\n`); process.exit(2); }
// rules v6 §1.5, before any trial: an excluded action needs a reason and the name of a compliance check of the role
// spec; a check cannot be both named and excluded; and (a gate run) every run in the gate has at least one
// compliance check named by its compliance / evidence rows. A table that fails one of these is not run.
{
  const probs = tableProblems(table).filter((x) => x.kind !== 'run-without-compliance-check' || phases.includes('gate')).map((x) => x.text);
  for (const u of tableUnits(table).units) for (const x of u.notApplicable) if (!checkKnown(spec, x.action)) probs.push(`${u.id}: not_applicable ${x.action} is no action, order, group or decision of kit/roles/${role}.yaml`);
  if (probs.length) { process.stderr.write(`the table cannot be run as it is (kit/release-rules.md §1.5; the fields: kit/schema/contract-table.md §6):\n${probs.map((x) => `  ${x}`).join('\n')}\na run needs a row with quantity 準拠 or 根拠, gate not false, and \`predicates\` naming at least one compliance check; an excluded action needs \`reason\`\n`); process.exit(2); }
}
const only = opt('cases') ? new RegExp(opt('cases')) : null;
const partial = !!only;
if (only) table = restrictTable(table, only);
const units = tableUnits(table).units.filter((u) => u.gated);
const planned = new Set(units.map((u) => u.id));
const tsum = tableSummary(table);
const isGate = phases.includes('gate') && !controlsOnly;
if (!phases.includes('gate') && phases.some((x) => !['screen', 'probe'].includes(x))) { process.stderr.write('--phases: the headline trials belong to a gate run (gate,headline)\n'); process.exit(2); }
const [hDir, hEntry] = [opt('harness') ?? HARNESS[role]?.[0] ?? null, opt('entry') ?? HARNESS[role]?.[1] ?? null];
const model = opt('model', MODEL);
const nControls = Number(opt('controls-trials', 1));
const minMiB = Math.round(Number(opt('min-free-gib', 6)) * 1024);

const sim = simulatedControls(spec, cases.filter((c) => planned.has(c.id)));
const simBad = sim.filter((r) => r.ok === false), simNa = sim.filter((r) => r.ok === null);
const trials = controlsOnly ? [] : planTrials({ rules, table, phases });
if (phases.includes('probe')) for (const u of units) for (let k = 1; k <= Number(opt('probe-trials', 3)); k++) trials.push({ phase: 'probe', arm: 'without', case: u.id, trial: k });
const controlTrials = cases.filter((c) => planned.has(c.id)).flatMap((c) => Object.entries(c.controls).filter(([, v]) => v.script !== undefined)
  .flatMap(([name]) => Array.from({ length: nControls }, (_, k) => ({ phase: 'controls', arm: `script:${name}`, case: c.id, trial: k + 1 }))));
const hv = harnessVersion(ROOT, hDir), gc = graderCommit(ROOT, role);
// what the run is fixed on, by content (written into run.json before the first trial), and what of it no commit holds
const fixed = () => runDigests(ROOT, { role, fixtures, table: tablePath, harness: hDir });
const fixedNow = fixed();
const dirtyNow = uncommitted(ROOT, fixedNow);
const dirtyLines = dirtyNow.map((x) => `  ${x.kind}: ${x.path} — ${x.why}`).join('\n');

say(`role ${role} | fixtures ${fixtures.join(', ')} | cases ${units.length}${partial ? ' (PARTIAL: --cases)' : ''} | table ${tablePath ?? (probeOnly ? 'none (a probe does not read the contract table: every selected case of the fixtures)' : 'none (every case = rule, provisional)')}`);
// rules v4 §1.3, before any trial: what the table puts in the gate, and the two lines of the main quantity
// (a table by rows: the compliance checks are the ones its rows name, and a run without one was refused above)
const noCompliance = tsum.unit === 'row' ? [] : units.filter((u) => !checkRead(spec, byId[u.id], byId[u.id].kit.kind === 'escalation' ? `escalation:${byId[u.id].kit.target}` : 'procedure.required')).map((u) => u.id);
if (phases.includes('gate')) say(`contract cases (${tsum.unit === 'row' ? 'rows of the table' : 'cases'}): ${tsum.rows} | in the gate ${tsum.in_gate} (compliance ${tsum.by_quantity.compliance}, evidence ${tsum.by_quantity.evidence}, harm ${tsum.by_quantity.harm}) on ${units.length} run(s) | outside the gate ${tsum.outside.length}`);
if (phases.includes('gate')) say(`runs with ${tsum.unit === 'row' ? 'a compliance check named by the table' : 'a readable required-action check'}: ${units.length - noCompliance.length}/${units.length}${noCompliance.length ? ` (none: ${noCompliance.join(', ')})` : ''} | evidence cases in the gate: ${tsum.by_quantity.evidence}`);
if (phases.includes('gate') && tsum.unit === 'row') {
  // rules v6 §1.5: what each run's compliance is made of, and the actions excluded as not applicable (count per run and in total)
  for (const u of units) say(`  compliance of ${u.id}: ${u.complianceChecks.join(', ')} | excluded as not applicable: ${u.notApplicable.length}${u.notApplicable.length ? ` (${u.notApplicable.map((x) => x.action).join(', ')})` : ''}`);
  say(`actions excluded as not applicable: ${units.reduce((a, u) => a + u.notApplicable.length, 0)} in total, on ${units.filter((u) => u.notApplicable.length).length} of ${units.length} run(s)`);
}
if (phases.includes('gate') && noCompliance.length) say(`ASK THE OWNER (main_quantity): ${noCompliance.length} run(s) in the gate have no required-action check`);
if (phases.includes('gate') && tsum.by_quantity.evidence === 0) say('ASK THE OWNER (main_quantity): no evidence case in the gate');
if (phases.includes('gate') && tsum.rows && tsum.outside.length / tsum.rows >= 0.3) say(`ASK THE OWNER (unmeasurable): ${tsum.outside.length} of ${tsum.rows} contract cases are outside the gate (30% or more)`);
say(`harness ${hv.version ?? 'none'} entry ${hEntry ?? '-'} | model ${model}${model === MODEL ? '' : ` (NOT the fixed ${MODEL})`} | rules v${rules.version} | grader ${gc.commit?.slice(0, 12) ?? '?'}${gc.dirty ? ' +uncommitted' : ''}`);
say(`fixed for the run (sha256 written to run.json before the first trial): ${Object.entries(fixedNow.files).map(([k, v]) => `${k} ${v.length}`).join(', ')} file(s) | commit ${short(fixedNow.head)} | not committed: ${dirtyNow.length || 'none'}`);
say(`self-check without a container: ${sim.filter((r) => r.ok).length} control(s) as built, ${simBad.length} not, ${simNa.length} not available${sim.some((r) => r.check_observed !== undefined) ? ` | the fixture's own check: run on ${sim.filter((r) => r.check_observed === true).length} control(s), assumed on ${sim.filter((r) => r.check_observed === false).length}${sim.some((r) => r.check_observed === false) ? ' (no POSIX bash: set PITWALL_BASH)' : ''}` : ''}`);
for (const r of simBad) say(`  NOT AS BUILT ${r.case} ${r.control}: expected ${r.expect}, graded ${r.outcome} (violations ${r.violations}) — ${simulatedControlWhy(spec, byId[r.case], r.control)}`);
for (const r of simNa) say(`  n/a ${r.case} ${r.control}: ${r.reason}`);
if (simBad.length) { say('stopped: the grader does not judge its own controls as built; no trial is evidence until this is fixed'); process.exit(2); }

if (flag('plan')) {
  const n = (p, a) => trials.filter((t) => t.phase === p && (!a || t.arm === a)).length;
  say(`plan${controlsOnly ? ' (--controls-only: the scripted controls only; not a gate run)' : ''}: scripted controls in docker ${controlTrials.length} (no model) | gate ${n('gate')} (with ${n('gate', 'with')}, without ${n('gate', 'without')}) | headline ${n('headline')} | screen ${n('screen')} | probe ${n('probe')} | model trials ${trials.length}`);
  say(`before every trial: available memory >= ${minMiB} MiB, 7-day quota below the line of experiments/quota.sh; one container at a time; no retry`);
  for (const t of [...controlTrials, ...trials]) say(`  ${t.phase.padEnd(8)} ${t.arm.padEnd(16)} ${t.case} t${t.trial}`);
  if (tsum.outside.length) say(`門の外（理由）— not planned: ${tsum.outside.length}`);
  for (const o of tsum.outside) say(`  門の外 ${o.row}${o.run !== o.row ? ` (run ${o.run})` : ''}: ${o.reason}`);
  const guardNow = process.platform === 'linux' ? guard(ROOT, { minMiB }) : { ok: false, why: 'not Linux: the trials run in WSL' };
  if (dirtyNow.length) say(`start now: would be refused (exit 2) — ${dirtyNow.length} of the files the run is fixed on are not committed:\n${dirtyLines}`);
  say(`guard now: ${guardNow.ok ? `ok (available ${guardNow.mem} MiB, quota ${guardNow.quota.reading})` : `would refuse: ${guardNow.why}`}`);
  process.exit(0);
}

// ---- the run (docker) ----------------------------------------------------------------------------------------
// a new run is fixed on committed files only (a resumed one is compared with its recorded digests below)
const resuming = !!opt('run-dir') && existsSync(join(resolve(opt('run-dir')), 'run.json'));
if (!resuming && dirtyNow.length) { process.stderr.write(`not started: ${dirtyNow.length} of the files this run would be fixed on are not committed, so their digests would map to no commit (kit/release-rules.json change_rule):\n${dirtyLines}\nCommit them (or restore them) first.\n`); process.exit(2); }
if (process.platform !== 'linux') { process.stderr.write('the trials run in docker (Harbor): start this inside WSL / Linux. --plan and --grade-only work anywhere.\n'); process.exit(2); }
const needsHarness = trials.some((t) => t.arm === 'with');
if (needsHarness && (!hDir || !existsSync(join(ROOT, hDir)))) { process.stderr.write(`no harness directory for ${role}: give --harness <dir> [--entry /cmd]\n`); process.exit(2); }
if (needsHarness && hv.dirty) { process.stderr.write(`the harness ${hDir} has uncommitted changes (or is untracked): a gate run needs a fixed harness version. Commit it first.\n`); process.exit(2); }
let runDir = opt('run-dir') ? resolve(opt('run-dir')) : null, run;
if (runDir && existsSync(join(runDir, 'run.json'))) {
  run = json(join(runDir, 'run.json'));
  for (const [k, v] of Object.entries({ role, harness_version: hv.version, model_id: model, rules_version: rules.version, rules_digest: rulesDigest(ROOT) })) if (run[k] !== v) { process.stderr.write(`cannot resume ${runDir}: ${k} was ${run[k]}, is now ${v}. Start a new run.\n`); process.exit(2); }
  const cmp = compareDigests(run.digests, fixedNow);
  if (!cmp.match) { process.stderr.write(`cannot resume ${runDir}: the files differ from the digests recorded before its first trial (${MARK} になる):\n${cmp.differences.map((d) => `  ${diffLine(d)}`).join('\n')}\nStart a new run. The saved trials can be read with --grade-only ${relative(ROOT, runDir).replace(/\\/g, '/')} (not a gate result; --regrade-with-current grades them for analysis, marked).\n`); process.exit(2); }
} else {
  if (controlsOnly) runDir ??= join(ROOT, 'runs/controls', `${role}-${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}`);
  if (!isGate && !runDir) { process.stderr.write('a screen / probe run is not a gate run: give --run-dir <dir>\n'); process.exit(2); }
  const n = !isGate ? null : allocateRun(ROOT, role, { started_at: new Date().toISOString(), harness_version: hv.version, model_id: model, rules_version: rules.version, provisional: !!table.provisional || partial || flag('skip-docker-controls'), digests: digestOfDigests(fixedNow) });
  runDir ??= join(ROOT, 'runs/gate', role, `run-${String(n).padStart(3, '0')}`);
  run = { run: n, role, fixtures, table: tablePath, partial, phases: controlsOnly ? ['controls'] : phases, ...(controlsOnly ? { controls_only: true } : {}), started_at: new Date().toISOString(), harness: hDir, entry: hEntry, harness_version: hv.version, harness_dirty: hv.dirty, model_id: model,
    rules_version: rules.version, rules_digest: rulesDigest(ROOT), grader_commit_at_start: gc.commit, docker_controls: flag('skip-docker-controls') ? 'skipped' : nControls, cases: cases.map((c) => ({ id: c.id, digest: c.digest })),
    // fixed before the first trial, by content: compared before every trial, on resume, and whenever this directory is graded
    digests: { ...fixedNow, recorded_at: new Date().toISOString() } };
  put(join(runDir, 'run.json'), run);
  if (isGate) closeRun(ROOT, role, n, { run_dir: relative(ROOT, runDir).replace(/\\/g, '/') });
}
say(`${isGate ? `gate run ${run.run}` : `${(run.phases ?? phases).join('+')} run (not a gate run)`} -> ${runDir}`);
const touch = dirname(runDir);   // experiments/quota.sh orders the directories two levels under runs/ by time
const todo = [...(flag('skip-docker-controls') ? [] : controlTrials), ...trials];
let stopped = null, drifted = false, done = 0, controlsChecked = false;
for (const t of todo) {
  if (existsSync(trialFile(runDir, t)) || existsSync(trialFile(runDir, t).replace(/\.json$/, '.started'))) continue;   // kept, or interrupted (= a failure): never run twice
  // the files the run is fixed on must still be the recorded ones: no trial is made on (or to be graded by) other files
  const drift = compareDigests(run.digests, fixed());
  if (!drift.match) { drifted = true; stopped = `the files this run was fixed on changed after it started (${drift.differences.map(diffLine).join('; ')})`; break; }
  // the self-check comes first: when a saved control is not as built, no model trial is started
  if (t.phase !== 'controls' && !controlsChecked) {
    controlsChecked = true;
    const bad = gradeRunDir({ root: ROOT, runDir, rules, table, tablePath, previous }).controls.filter((c) => !c.ok);
    if (bad.length) { for (const c of bad) say(`CONTROL NOT AS BUILT: ${c.case} ${c.control} t${c.trial}: ${c.why}`); stopped = 'the grader does not judge its controls as built in the container'; break; }
  }
  const g = guard(ROOT, { minMiB });
  if (!g.ok) { stopped = g.why; break; }
  say(`[${new Date().toISOString().slice(11, 16)}] ${t.phase} ${t.arm} ${t.case} t${t.trial} (available ${g.mem} MiB, quota ${g.quota.reading})`);
  const s = await runTrial({ root: ROOT, runDir, kase: byId[t.case], t, model, harness: hDir, entry: hEntry, touch, before: g });
  done++;
  say(`    ${s.infra_error ? `INFRA FAILURE (counts as a failure): ${s.infra_error}` : 'saved'} in ${s.wall_seconds} s`);
}
const left = todo.filter((t) => !existsSync(trialFile(runDir, t)) && !existsSync(trialFile(runDir, t).replace(/\.json$/, '.started'))).length;
if (stopped) say(`STOPPED before the next trial: ${stopped}. ${left} trial(s) left. ${drifted ? 'This run cannot be continued: start a new run' : `Start again with: node scripts/release-gate.mjs ${role} --run-dir ${relative(ROOT, runDir).replace(/\\/g, '/')} (and the same other options)`}`);
const r = finish(runDir, table, tablePath);
const nag = r.verdict.gate === 'not_a_gate_result';
if (controlsOnly) { const bad = r.controls.filter((c) => !c.ok); say(nag ? `not graded: ${MARK}.` : `controls only (not a gate result): ${r.controls.length - bad.length}/${r.controls.length} graded as built -> ${join(runDir, 'verdict.md')}`); process.exit(nag ? 3 : stopped ? 4 : bad.length || !r.controls.length ? 1 : 0); }
if (!isGate) { say(nag ? `not graded: ${MARK}. No result is claimed from this ${phases.join('+')} run.` : `saved: ${join(runDir, 'graded.json')} (${r.graded.length} graded trial(s)). No gate verdict is claimed from a ${phases.join('+')} run.`); process.exit(nag ? 3 : stopped ? 4 : 0); }
const complete = left === 0 && !partial && !flag('skip-docker-controls');
if (!complete) { r.verdict.provisional = true; say('this run is not complete (stopped, partial, or controls skipped): its verdict is provisional'); }
const summary = `kit/results/gate/${role}/run-${String(run.run).padStart(3, '0')}.json`;
const na = r.verdict.summary?.not_applicable ?? null;      // rules v6 §1.5: the number of actions excluded as not applicable goes into the numbered record
// the numbered record carries run.digests (what the run was fixed on) and verdict.digest_check (whether this grading used the same files)
put(join(ROOT, summary), { run: { ...run, finished_at: new Date().toISOString(), trials_done_now: done, trials_left: left, not_applicable: na ? { total: na.total, per_run: na.per_run } : null }, verdict: r.verdict, controls: r.controls, screen: r.screen, trials: r.graded });
closeRun(ROOT, role, run.run, { status: left === 0 ? 'graded' : 'stopped', gate: r.verdict.gate, provisional: !!r.verdict.provisional, claude_code_version: r.verdict.conditions.claude_code_version ?? null, grader_commit: r.verdict.conditions.grader_commit ?? null, not_applicable_total: na?.total ?? null, summary });
say(`run record: ${summary} | ledger: kit/results/gate/${role}/ledger.json (${readLedger(ROOT, role).runs.length} run(s) so far)`);
process.exit(nag ? 3 : stopped ? 4 : r.verdict.gate === 'pass' && !r.verdict.provisional ? 0 : 1);
