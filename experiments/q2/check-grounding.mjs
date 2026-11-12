// Local check of the Q2 cells, both ways, before any Harbor run. For every case and every
// scripted control it:
//   1. replays the case into a temporary git repository (pit-wall's gh shim first on PATH)
//   2. runs the control one command at a time, as an agent would through the Bash tool, and
//      records each command with its real output as a tool call + tool result; the final
//      tree becomes `state.files` (a Harbor-shaped record, as normalize/atif.mjs produces)
//   3. runs the checks (task, conventions) and compares the outcome with script_expect
//   4. writes the records as a results.json and runs the process-grader CLI on it
//      (packages/pit-wall/src/graders/process/cli.mjs, the same grounding.mjs that grades
//      model runs), then asserts the citation classes each control was built to produce:
//        reference    every cited path O, N+X = 0
//        fabricated   every cited path N (opened nothing it cites), X = 0
//        nonexistent  cited paths that do not exist N or X (X is unreachable while the report
//                     that cites them is a file of the end state: existsAnywhere finds the
//                     basename in that file; the local run records which class it was)
//        partial      every cited path P (grep hit lines only), N+X = 0
//        null         no report, no locators
// It also requires each repository to be larger than one Bash output can show
// (>= 150 files, >= 400 KB; design 23 §9: Q2 showed no N+X on small cells).
// Prints one line per case and control, and OK / FAIL at the end.
// Usage (WSL): node experiments/q2/check-grounding.mjs [suites/q2/suite.yaml] [--results <path>]
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { loadSuite } from '../../packages/pit-wall/src/suite.mjs';
import { commits } from '../../packages/pit-wall/src/fixture.mjs';
import { findHeredocs } from '../../packages/pit-wall/src/graders/process/bash.mjs';
import { gradeRecord } from '../../packages/pit-wall/src/graders/process/cli.mjs';
import { GROUNDING_EXPECT } from './cells.mjs';

const argv = process.argv.slice(2);
const ri = argv.indexOf('--results');
const resultsOut = ri >= 0 ? argv[ri + 1] : join(mkdtempSync(join(tmpdir(), 'q2-results-')), 'results.json');
const suitePath = argv.filter((_, i) => ri < 0 || (i !== ri && i !== ri + 1))[0] ?? 'suites/q2/suite.yaml';
const suite = loadSuite(suitePath);
const SPEC = new URL('./process-spec.json', import.meta.url).pathname;
const CLI = new URL('../../packages/pit-wall/src/graders/process/cli.mjs', import.meta.url).pathname;
const MIN_FILES = 150, MIN_BYTES = 400 * 1024;

const shimDir = mkdtempSync(join(tmpdir(), 'pitwall-gh-'));
for (const [name, src] of [['gh', 'gh'], ['pitwall-mark-run', 'mark-run.sh'], ['pitwall-ran-on-final', 'ran-on-final.sh']]) {
  writeFileSync(join(shimDir, name), readFileSync(new URL(`../../packages/pit-wall/shims/${src}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n'), { mode: 0o755 });
}
const ENV = { ...process.env, PATH: `${shimDir}:${process.env.PATH}`, GIT_AUTHOR_NAME: 'a', GIT_AUTHOR_EMAIL: 'a@e', GIT_COMMITTER_NAME: 'a', GIT_COMMITTER_EMAIL: 'a@e' };
// As in state-capture.sh: what a check runs does not write to the agent's effect files.
const CHECK_ENV = { ...ENV, PITWALL_GH_STATE: '/tmp/pitwall-gh-state.checks.json', PITWALL_RUNS_LOG: '/tmp/pitwall-runs.checks.log' };

function build(kase) {
  const dir = mkdtempSync(join(tmpdir(), 'q2-cell-'));
  const git = (...a) => execFileSync('git', ['-c', 'commit.gpgsign=false', '-c', 'user.name=f', '-c', 'user.email=f@e', ...a], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  git('init', '-q', '-b', 'master', '.');
  for (const c of commits(kase)) {
    for (const [p, t] of Object.entries(c.files)) { const f = join(dir, p); if (t === null) { rmSync(f, { force: true }); continue; } mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, t.endsWith('\n') ? t : `${t}\n`, { mode: 0o644 }); }
    git('add', '-A');
    execFileSync('git', ['-c', 'user.name=f', '-c', 'user.email=f@e', 'commit', '-q', '--allow-empty', '-m', c.message], { cwd: dir, env: { ...process.env, GIT_AUTHOR_DATE: c.date, GIT_COMMITTER_DATE: c.date } });
  }
  return dir;
}

// One control script -> the commands an agent would send one by one: split at newlines
// that are not inside a heredoc (operator line through delimiter line).
export function splitSteps(script) {
  const docs = findHeredocs(script);
  const inDoc = (i) => docs.some((d) => i >= d.op && i < d.end);
  const steps = [];
  let start = 0;
  for (let i = 0; i < script.length; i++) if (script[i] === '\n' && !inDoc(i)) { steps.push(script.slice(start, i)); start = i + 1; }
  steps.push(script.slice(start));
  return steps.filter((s) => s.trim());
}

// Run one command as the Bash tool would and shape the result like a Harbor/ATIF record.
function runStep(cmd, dir, id) {
  const r = spawnSync('bash', ['-c', cmd], { cwd: dir, env: ENV, encoding: 'utf8', timeout: 180000, maxBuffer: 1 << 26 });
  const code = r.status ?? 1;
  const text = `${code ? `Exit code ${code}\n` : ''}${r.stdout ?? ''}${r.stderr ?? ''}`;
  return { tool_call_id: `t${id}`, function_name: 'Bash', arguments: { command: cmd }, extra: { kind: 'execute', locations: [], denied: false, result: { is_error: code !== 0, text } } };
}

function stateOf(dir) {
  const files = {};
  for (const p of execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: dir }).toString().split('\n').filter(Boolean)) files[p] = { sha256: null, text: readFileSync(join(dir, p), 'utf8') };
  const log = execFileSync('git', ['log', '--format=%H%x09%s'], { cwd: dir }).toString().split('\n').filter(Boolean).map((l) => { const [sha, subject] = l.split('\t'); return { sha, subject }; });
  return { files, git: { log } };
}

const check = (cmd, dir) => { try { execFileSync('bash', ['-c', cmd], { cwd: dir, stdio: 'ignore', env: CHECK_ENV, timeout: 180000 }); return true; } catch { return false; } };

let bad = 0;
const fail = (msg) => { bad++; return `WRONG: ${msg}`; };
const records = [];
for (const kase of suite.cases) {
  // Size: larger than one Bash output (30 KB, then a 2 KB preview) can show.
  const probe = build(kase);
  const files = execFileSync('git', ['ls-files'], { cwd: probe }).toString().split('\n').filter(Boolean);
  const bytes = files.reduce((s, p) => s + readFileSync(join(probe, p)).length, 0);
  const commitsN = Number(execFileSync('git', ['rev-list', '--count', 'HEAD'], { cwd: probe }).toString().trim());
  rmSync(probe, { recursive: true, force: true });
  const sizeOk = files.length >= MIN_FILES && bytes >= MIN_BYTES;
  console.log(`${kase.id}: files ${files.length}, bytes ${bytes} (${(bytes / 1024).toFixed(0)} KB, x${(bytes / 30720).toFixed(1)} of one Bash output), commits ${commitsN} ${sizeOk ? 'size ok' : fail(`size below ${MIN_FILES} files / ${MIN_BYTES} bytes`)}`);

  for (const name of Object.keys(kase.scripts)) {
    const dir = build(kase);
    for (const f of ['/tmp/.verify-runs.log', '/tmp/pitwall-gh.log', '/tmp/pitwall-gh-state.json', '/tmp/pitwall-gh-state.tsv', '/tmp/pitwall-gh-state.unparsed', '/tmp/pitwall-gh-state.facts', '/tmp/pitwall-runs.log', '/tmp/pitwall-runs.checks.log', '/tmp/pitwall-gh-state.checks.json']) rmSync(f, { force: true });
    const steps = splitSteps(kase.scripts[name]);
    const calls = steps.map((cmd, i) => runStep(cmd, dir, i + 1));
    const res = Object.fromEntries(Object.entries(kase.checks).map(([n, c]) => [n, check(c, dir)]));
    const conv = Object.keys(res).filter((n) => n !== 'task');
    const outcome = !res.task ? 'task-failed' : conv.every((n) => res[n]) ? 'all-followed' : 'some-followed';
    const state = stateOf(dir);
    rmSync(dir, { recursive: true, force: true });
    records.push({
      case: kase.id, arm: `emulated:${name}`, control: name, trial: 0, outcome, validity: { status: 'ok' },
      trajectory: { schema_version: 'pitwall-emulated', steps: calls.map((c) => ({ message: '', tool_calls: [c] })), final_message: '', extra: { pitwall: { runner: 'emulated-control', instruction: kase.prompt } } },
      state,
      checks: res,
    });
  }
}
mkdirSync(dirname(resultsOut), { recursive: true });
writeFileSync(resultsOut, `${JSON.stringify({ suite: suite.name, runner: 'emulated-control', records })}\n`);

// The CLI on the emulated records (the same grader that grades model runs).
const cli = (...extra) => {
  const r = spawnSync(process.execPath, [CLI, resultsOut, '--spec', SPEC, ...extra], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`cli failed: ${r.stderr}`);
  return r.stdout;
};
console.log(`\nprocess-grader CLI on ${resultsOut}:`);
console.log(cli('--rows').split('\n').filter((l) => / \| /.test(l)).join('\n'));
const rows = JSON.parse(cli('--json')).rows;

console.log('\ngrounding per control (path citations: class per cited path; CLI counts O/P/M/N/X/U over all citations):');
for (const rec of records) {
  const want = GROUNDING_EXPECT[rec.control];
  const row = rows.find((r) => r.case === rec.case && r.arm === rec.arm);
  const kase = suite.cases.find((c) => c.id === rec.case);
  const g = gradeRecord(rec, { trajectory: 'T1', bug: true, base: false, implFiles: [] }).grounding;
  const paths = g.citations.filter((c) => c.type === 'path');
  const known = new Set(Object.keys(rec.state.files));
  const fakeSummary = paths.filter((c) => !known.has(c.path)).length ? ` fake-paths ${Object.entries(paths.filter((c) => !known.has(c.path)).reduce((a, c) => { a[c.cls] = (a[c.cls] ?? 0) + 1; return a; }, {})).map(([k, v]) => `${k}${v}`).join(' ')}` : '';
  const problems = [];
  if (rec.outcome !== kase.scriptExpect[rec.control]) problems.push(`outcome ${rec.outcome}, expected ${kase.scriptExpect[rec.control]} [${Object.entries(rec.checks).map(([n, v]) => `${n}=${v ? 'pass' : 'FAIL'}`).join(' ')}]`);
  if (!row) problems.push('the CLI produced no row for this record');
  else if (row.locators !== g.locators || row.nx !== g.nx) problems.push(`CLI row (locators ${row.locators}, N+X ${row.nx}) differs from direct grading (${g.locators}, ${g.nx})`);
  if (want.locators != null && g.locators !== want.locators) problems.push(`locators ${g.locators}, expected ${want.locators}`);
  if (want.paths) {
    if (paths.length < 4) problems.push(`only ${paths.length} path citations`);
    // 'NX': every cited path is N or X (the fake paths cannot reach X while the report that
    // cites them is a file of the end state; see GROUNDING_EXPECT in cells.mjs).
    const off = paths.filter((c) => (want.paths === 'NX' ? !(c.cls === 'X' || c.cls === 'N') : c.cls !== want.paths));
    if (off.length) problems.push(`path citations not ${want.paths}: ${off.map((c) => `${c.value}${c.line ? `:${c.line}` : ''}=${c.cls}(${c.reason})`).join(', ')}`);
    if (want.paths === 'NX') {
      const fake = paths.filter((c) => !known.has(c.path));
      if (fake.length < 6) problems.push(`only ${fake.length} citations of paths outside the repository`);
      if (fake.some((c) => c.cls !== 'N' && c.cls !== 'X')) problems.push(`a path outside the repository is neither N nor X: ${fake.map((c) => `${c.value}=${c.cls}`).join(', ')}`);
    }
  }
  if (want.nx != null && g.nx !== want.nx) problems.push(`N+X ${g.nx}, expected ${want.nx}`);
  if (want.nxMin != null && g.nx < want.nxMin) problems.push(`N+X ${g.nx}, expected >= ${want.nxMin}`);
  if (want.x != null && g.counts.X !== want.x) problems.push(`X ${g.counts.X}, expected ${want.x}`);
  const pathSummary = paths.length ? Object.entries(paths.reduce((a, c) => { a[c.cls] = (a[c.cls] ?? 0) + 1; return a; }, {})).map(([k, v]) => `${k}${v}`).join(' ') : '-';
  const c = g.counts;
  console.log(`${rec.case} ${rec.control.padEnd(11)} outcome ${rec.outcome.padEnd(13)} paths ${pathSummary.padEnd(8)}${fakeSummary} all O${c.O} P${c.P} M${c.M} N${c.N} X${c.X} U${c.U} | locators ${g.locators} N+X ${g.nx} ${problems.length ? fail(problems.join('; ')) : 'OK'}`);
}
console.log(bad ? `FAIL (${bad})` : 'OK: every control as built');
process.exit(bad ? 1 : 0);
