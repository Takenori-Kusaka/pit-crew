// Local check of the job-selection cells, before any Harbor run: replay each case into a temporary
// git repository, run each scripted control with pit-wall's gh shim first on PATH, then
//   1. derive the outcome from the checks (task, conventions) and compare it with script_expect
//   2. classify the selection error (judge.mjs) from the directory and from the same state shaped
//      as a pit-wall record; both must agree and equal errorExpect (cells.mjs)
//   3. both directions: per case the correct control gives no error and at least one control gives
//      the case's error; over the suite every error type is produced by some control
// Prints one line per case and control, and FAIL/OK at the end. Usage (WSL):
//   node experiments/jobsel/check-controls.mjs [suites/jobsel/suite.yaml] [--results <path>]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { loadSuite } from '../../packages/pit-wall/src/suite.mjs';
import { commits } from '../../packages/pit-wall/src/fixture.mjs';
import { errorExpect } from './cells.mjs';
import { errorOf, errorOfDir } from './judge.mjs';

const argv = process.argv.slice(2);
const ri = argv.indexOf('--results');
const resultsOut = ri >= 0 ? argv[ri + 1] : null;
const suite = loadSuite(argv.filter((_, i) => ri < 0 || (i !== ri && i !== ri + 1))[0] ?? 'suites/jobsel/suite.yaml');
const records = [];
const shimDir = mkdtempSync(join(tmpdir(), 'pitwall-gh-'));
writeFileSync(join(shimDir, 'gh'), readFileSync(new URL('../../packages/pit-wall/shims/gh', import.meta.url), 'utf8').replace(/\r\n/g, '\n'), { mode: 0o755 });
const env = { ...process.env, PATH: `${shimDir}:${process.env.PATH}`, GIT_AUTHOR_NAME: 'a', GIT_AUTHOR_EMAIL: 'a@e', GIT_COMMITTER_NAME: 'a', GIT_COMMITTER_EMAIL: 'a@e' };
const run = (cmd, dir, prefix = '') => { const f = join(mkdtempSync(join(tmpdir(), 'jobsel-sh-')), 's.sh'); writeFileSync(f, `${prefix}${cmd}\n`); try { execFileSync('bash', [f], { cwd: dir, stdio: 'ignore', env, timeout: 180000 }); return true; } catch { return false; } };

function build(kase) {
  const dir = mkdtempSync(join(tmpdir(), 'jobsel-cell-'));
  const git = (...a) => execFileSync('git', ['-c', 'commit.gpgsign=false', '-c', 'user.name=f', '-c', 'user.email=f@e', ...a], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  git('init', '-q', '-b', 'master', '.');
  for (const c of commits(kase)) {
    for (const [p, t] of Object.entries(c.files)) { const f = join(dir, p); if (t === null) { rmSync(f, { force: true }); continue; } mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, t.endsWith('\n') ? t : `${t}\n`, { mode: 0o644 }); }
    git('add', '-A');
    execFileSync('git', ['-c', 'user.name=f', '-c', 'user.email=f@e', 'commit', '-q', '--allow-empty', '-m', c.message], { cwd: dir, env: { ...process.env, GIT_AUTHOR_DATE: c.date, GIT_COMMITTER_DATE: c.date } });
  }
  return dir;
}

let bad = 0;
const produced = new Set();
for (const kase of suite.cases) {
  const want = errorExpect[kase.id];
  if (!want) { bad++; console.log(`${kase.id}: no errorExpect`); continue; }
  const got = {};
  for (const s of Object.keys(kase.scripts)) {
    const dir = build(kase);
    for (const f of ['/tmp/.verify-runs.log', '/tmp/pitwall-gh.log']) rmSync(f, { force: true });
    const ran = run(kase.scripts[s], dir, 'set -u\n');
    const res = Object.fromEntries(Object.entries(kase.checks).map(([n, c]) => [n, run(c, dir)]));
    const conv = Object.keys(res).filter((n) => n !== 'task');
    const outcome = !res.task ? 'task-failed' : conv.every((n) => res[n]) ? 'all-followed' : 'some-followed';
    const gh = existsSync('/tmp/pitwall-gh.log') ? readFileSync('/tmp/pitwall-gh.log', 'utf8').split('\n').filter(Boolean) : [];
    const eDir = errorOfDir(kase.id, dir, gh);
    const files = {};
    for (const p of execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: dir }).toString().split('\n').filter(Boolean)) files[p] = { text: readFileSync(join(dir, p), 'utf8') };
    const eRec = errorOf({ case: kase.id, state: { files, commands: { gh } } });
    records.push({ case: kase.id, arm: `script:${s}`, trial: 0, outcome, state: { files, commands: { gh } } });
    const err = eDir === eRec ? eDir : `mismatch(dir=${eDir},record=${eRec})`;
    got[s] = err;
    if (err) produced.add(err);
    const ok = ran && outcome === kase.scriptExpect[s] && err === (s in want ? want[s] : 'unset');
    if (!ok) bad++;
    console.log(`${kase.id} ${s.padEnd(12)} script ${ran ? 'ok ' : 'ERR'} outcome ${outcome} (expected ${kase.scriptExpect[s]}) error ${err} (expected ${want[s]}) ${ok ? 'OK' : 'WRONG'} [${Object.entries(res).map(([n, v]) => `${n}=${v ? 'pass' : 'FAIL'}`).join(' ')}]`);
    rmSync(dir, { recursive: true, force: true });
  }
  // Both directions per case: the right job scores no error, and some control is caught.
  if (got.correct !== null) { bad++; console.log(`${kase.id}: correct control is not error-free`); }
  if (!Object.values(got).some((e) => e)) { bad++; console.log(`${kase.id}: no control produces an error`); }
}
for (const e of ['overreach', 'omission', 'over-escalation', 'too-shallow', 'too-heavy']) if (!produced.has(e)) { bad++; console.log(`no control produces ${e}`); }
if (resultsOut) { mkdirSync(dirname(resultsOut), { recursive: true }); writeFileSync(resultsOut, `${JSON.stringify({ suite: suite.name, records })}\n`); }
console.log(bad ? `FAIL (${bad})` : 'OK: every control as built');
process.exit(bad ? 1 : 0);
