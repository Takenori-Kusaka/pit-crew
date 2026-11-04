// Local check of the D3 cells, before any Harbor run: replay each case into a temporary git
// repository, run each scripted control with pit-wall's gh shim first on PATH, then
//   1. derive the outcome from the checks (task, conventions) and compare it with script_expect
//   2. decide harm (harm.mjs) and require: null and reference no harm, harmful harm
// Prints one line per case and script, and FAIL/OK at the end. Usage (WSL):
//   node experiments/d3/check-controls.mjs [suites/d3/suite.yaml]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { loadSuite } from '../../packages/pit-wall/src/suite.mjs';
import { commits } from '../../packages/pit-wall/src/fixture.mjs';
import { harmOf, harmOfDir } from './harm.mjs';

// --results <path>: also write the controls' final states as a pit-wall results.json (for harm-run.mjs).
const argv = process.argv.slice(2);
const ri = argv.indexOf('--results');
const resultsOut = ri >= 0 ? argv[ri + 1] : null;
const suite = loadSuite(argv.filter((_, i) => ri < 0 || (i !== ri && i !== ri + 1))[0] ?? 'suites/d3/suite.yaml');
const records = [];
const shimDir = mkdtempSync(join(tmpdir(), 'pitwall-gh-'));
writeFileSync(join(shimDir, 'gh'), readFileSync(new URL('../../packages/pit-wall/shims/gh', import.meta.url), 'utf8').replace(/\r\n/g, '\n'), { mode: 0o755 });
const env = { ...process.env, PATH: `${shimDir}:${process.env.PATH}`, GIT_AUTHOR_NAME: 'a', GIT_AUTHOR_EMAIL: 'a@e', GIT_COMMITTER_NAME: 'a', GIT_COMMITTER_EMAIL: 'a@e' };
const sh = (cmd, dir) => { const f = join(mkdtempSync(join(tmpdir(), 'd3-sh-')), 's.sh'); writeFileSync(f, `set -u\n${cmd}\n`); try { execFileSync('bash', [f], { cwd: dir, stdio: 'ignore', env, timeout: 180000 }); return true; } catch { return false; } };
const shCheck = (cmd, dir) => { const f = join(mkdtempSync(join(tmpdir(), 'd3-ck-')), 'c.sh'); writeFileSync(f, cmd); try { execFileSync('bash', [f], { cwd: dir, stdio: 'ignore', env, timeout: 180000 }); return true; } catch { return false; } };

function build(kase) {
  const dir = mkdtempSync(join(tmpdir(), 'd3-cell-'));
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
for (const kase of suite.cases) {
  for (const s of Object.keys(kase.scripts)) {
    const dir = build(kase);
    for (const f of ['/tmp/.verify-runs.log', '/tmp/pitwall-gh.log']) rmSync(f, { force: true });
    const ran = sh(kase.scripts[s], dir);
    const res = Object.fromEntries(Object.entries(kase.checks).map(([n, c]) => [n, shCheck(c, dir)]));
    const conv = Object.keys(res).filter((n) => n !== 'task');
    const outcome = !res.task ? 'task-failed' : conv.every((n) => res[n]) ? 'all-followed' : 'some-followed';
    const gh = existsSync('/tmp/pitwall-gh.log') ? readFileSync('/tmp/pitwall-gh.log', 'utf8').split('\n').filter(Boolean) : [];
    const harmDir = harmOfDir(kase.id, dir, gh);
    // The same state as a pit-wall record (state.files / state.commands.gh) must give the same harm.
    const files = {};
    for (const p of execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: dir }).toString().split('\n').filter(Boolean)) files[p] = { text: readFileSync(join(dir, p), 'utf8') };
    for (const p of execFileSync('bash', ['-c', 'find build -type f 2>/dev/null || true'], { cwd: dir }).toString().split('\n').filter(Boolean)) files[p] = { text: readFileSync(join(dir, p), 'utf8') };
    const harmRec = harmOf({ case: kase.id, state: { files, commands: { gh } } });
    records.push({ case: kase.id, arm: `script:${s}`, trial: 0, outcome, state: { files, commands: { gh } } });
    const harm = harmDir === harmRec ? harmDir : `mismatch(dir=${harmDir},record=${harmRec})`;
    // null leaves the cell's fault in place, so its harm is not a property of the predicate.
    const wantHarm = s === 'null' ? harm : s === 'harmful';
    const ok = ran && outcome === kase.scriptExpect[s] && harm === wantHarm;
    if (!ok) bad++;
    console.log(`${kase.id} ${s.padEnd(9)} script ${ran ? 'ok ' : 'ERR'} outcome ${outcome} (expected ${kase.scriptExpect[s]}) harm ${harm} (expected ${wantHarm}) ${ok ? 'OK' : 'WRONG'} [${Object.entries(res).map(([n, v]) => `${n}=${v ? 'pass' : 'FAIL'}`).join(' ')}]`);
    rmSync(dir, { recursive: true, force: true });
  }
}
if (resultsOut) { mkdirSync(dirname(resultsOut), { recursive: true }); writeFileSync(resultsOut, `${JSON.stringify({ suite: suite.name, records })}\n`); }
console.log(bad ? `FAIL (${bad})` : 'OK: every control as built');
process.exit(bad ? 1 : 0);
