// Local check of the subject-2 cells, before any Harbor run: replay each case into a temporary git
// repository, run each scripted control with pit-wall's shims first on PATH (gh, pitwall-mark-run,
// pitwall-ran-on-final, as in the Harbor image), then check:
//   s2-1 (several keys, legacy checks): outcome as in script_expect; adapterConformance agrees with
//     every key's shell check; reference follows every key, generic none; harm only for harmful.
//   s2-k1 / s2-k5 / s2-k3b / s2-k4b / s2-k2c (one key each, effects): outcome as in script_expect; reference and every eq-*
//     follow the key; generic and every adv-* do not; no control is undecidable; both ways — the
//     record carrying the sandbox's exit codes equals the shell check, and the record alone equals
//     it wherever it decides; the gh state of each invocation-only equivalent (cell.sameGh) is
//     identical to reference's through the real shim.
// Prints one line per case and control, and FAIL/OK at the end. Usage (WSL):
//   node experiments/subject2/check-controls.mjs [suites/subject2/suite.yaml] [--results <path>]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { loadSuite } from '../../packages/pit-wall/src/suite.mjs';
import { commits } from '../../packages/pit-wall/src/fixture.mjs';
import { adapterConformance, ADAPTER_KEYS } from './adapter-check.mjs';
import { harmOf, harmOfDir, readDir } from './harm.mjs';
import { cells5 } from './cells5.mjs';
import { cells6 } from './cells6.mjs';
import { cells7 } from './cells7.mjs';

const argv = process.argv.slice(2);
const ri = argv.indexOf('--results');
const resultsOut = ri >= 0 ? argv[ri + 1] : null;
const suite = loadSuite(argv.filter((_, i) => ri < 0 || (i !== ri && i !== ri + 1))[0] ?? 'suites/subject2/suite.yaml');
const single = Object.fromEntries([...cells5, ...cells6, ...cells7].map((c) => [c.id, c]));
const records = [];
const shimDir = mkdtempSync(join(tmpdir(), 'pitwall-gh-'));
const shim = (name, src) => writeFileSync(join(shimDir, name), readFileSync(new URL(`../../packages/pit-wall/shims/${src}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n'), { mode: 0o755 });
shim('gh', 'gh');
shim('pitwall-mark-run', 'mark-run.sh');
shim('pitwall-ran-on-final', 'ran-on-final.sh');
const env = { ...process.env, PATH: `${shimDir}:${process.env.PATH}`, GIT_AUTHOR_NAME: 'a', GIT_AUTHOR_EMAIL: 'a@e', GIT_COMMITTER_NAME: 'a', GIT_COMMITTER_EMAIL: 'a@e' };
// As in state-capture.sh: gh calls and marked runs made by the checks go to other files.
const CHECK_ENV = { ...env, PITWALL_GH_STATE: '/tmp/pitwall-gh-state.checks.json', PITWALL_RUNS_LOG: '/tmp/pitwall-runs.checks.log', PITWALL_AGENT_RUNS_LOG: '/tmp/pitwall-runs.log' };
const run = (cmd, dir, e, pre = '') => { const f = join(mkdtempSync(join(tmpdir(), 's2-sh-')), 's.sh'); writeFileSync(f, `${pre}${cmd}\n`); try { execFileSync('bash', [f], { cwd: dir, stdio: 'ignore', env: e, timeout: 180000 }); return 0; } catch (x) { return x.status ?? 1; } };
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);

function build(kase) {
  const dir = mkdtempSync(join(tmpdir(), 's2-cell-'));
  const git = (...a) => execFileSync('git', ['-c', 'commit.gpgsign=false', '-c', 'user.name=f', '-c', 'user.email=f@e', ...a], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  git('init', '-q', '-b', 'master', '.');
  for (const c of commits(kase)) {
    // As fixture.mjs writes them in the image: text + newline, mode 644, then the commit.
    for (const [p, t] of Object.entries(c.files)) { const f = join(dir, p); if (t === null) { rmSync(f, { force: true }); continue; } mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, `${t}\n`, { mode: 0o644 }); }
    git('add', '-A');
    execFileSync('git', ['-c', 'user.name=f', '-c', 'user.email=f@e', 'commit', '-q', '--allow-empty', '-m', c.message], { cwd: dir, env: { ...process.env, GIT_AUTHOR_DATE: c.date, GIT_COMMITTER_DATE: c.date } });
  }
  return dir;
}

let bad = 0;
for (const kase of suite.cases) {
  const one = single[kase.id];
  const exercised = Object.keys(kase.checks).filter((n) => n !== 'task');
  const ghStates = {};
  for (const s of Object.keys(kase.scripts)) {
    const dir = build(kase);
    execFileSync('bash', ['-c', 'rm -f /tmp/.verify-runs.log /tmp/pitwall-gh.log /tmp/pitwall-gh-state.* /tmp/pitwall-runs.log /tmp/pitwall-runs.checks.log']);
    const ran = run(kase.scripts[s], dir, env, 'set -u\n') === 0;
    let finalTree = '';
    if (one) { try { finalTree = execFileSync(join(shimDir, 'pitwall-mark-run'), ['--tree'], { cwd: dir, env }).toString().trim(); } catch { finalTree = ''; } }
    const codes = Object.fromEntries(Object.entries(kase.checks).map(([n, c]) => [n, run(c, dir, one ? { ...CHECK_ENV, PITWALL_FINAL_TREE: finalTree } : env)]));
    const res = Object.fromEntries(Object.entries(codes).map(([n, c]) => [n, c === 0]));
    const outcome = !res.task ? 'task-failed' : exercised.every((n) => res[n]) ? 'all-followed' : 'some-followed';
    const gh = (read('/tmp/pitwall-gh.log') ?? '').split('\n').filter(Boolean);
    const files = Object.fromEntries(Object.entries(readDir(dir)).map(([p, t]) => [p, { text: t }]));
    const log = execFileSync('git', ['log', '--all', '--format=%H %cI %s'], { cwd: dir }).toString().split('\n').filter(Boolean)
      .map((l) => { const [sha, date, ...msg] = l.split(' '); return { sha, date, message: msg.join(' ') }; });
    const state = { files, git: { log }, commands: { gh } };
    if (one) {
      const j = read('/tmp/pitwall-gh-state.json');
      state.gh = j ? JSON.parse(j) : { items: {}, created: { pullRequests: [], issues: [] } };
      state.ghUnparsed = (read('/tmp/pitwall-gh-state.unparsed') ?? '').split('\n').filter(Boolean).map((l) => ({ reason: l.split('\t')[0], call: l.split('\t').slice(1).join('\t') }));
      state.runs = (read('/tmp/pitwall-runs.log') ?? '').split('\n').filter(Boolean).map((l) => { const [name, ts, code, tree] = l.split('\t'); return { name, ts, code: Number(code), tree: tree || null }; });
      state.finalTree = finalTree || null;
      ghStates[s] = j ?? '';
    }
    const record = { case: kase.id, arm: `script:${s}`, trial: 0, outcome, state };
    records.push(record);
    const problems = [];
    if (!ran) problems.push('script error');
    if (outcome !== kase.scriptExpect[s]) problems.push(`outcome ${outcome} (expected ${kase.scriptExpect[s]})`);
    let note = '';
    if (one) {
      const k = one.key;
      const shell = codes[k] === 0 ? 'followed' : codes[k] === 2 ? 'undecidable' : 'not followed';
      const viaChecks = adapterConformance({ ...record, state: { ...state, checks: codes } }, { fromChecks: true });
      const alone = adapterConformance(record);
      if (viaChecks[k] !== shell) problems.push(`via checks ${viaChecks[k]} vs shell ${shell}`);
      if (alone[k] !== 'undecidable' && alone[k] !== shell) problems.push(`record alone ${alone[k]} vs shell ${shell}`);
      for (const other of ADAPTER_KEYS) if (other !== k && alone[other] !== 'not applicable') problems.push(`${other} graded in a single-key cell`);
      if (shell === 'undecidable' || codes.task === 2) problems.push('undecidable in a control');
      const want = s === 'reference' || s.startsWith('eq-') ? 'followed' : s === 'null' || s === 'generic' || s.startsWith('adv-') ? 'not followed' : null;
      if (want && shell !== want) problems.push(`${k} ${shell} (must be ${want})`);
      note = ` record-alone=${alone[k]}`;
    } else {
      const conf = adapterConformance(record);
      for (const k of ADAPTER_KEYS) {
        if (!exercised.includes(k)) { if (conf[k] !== 'not applicable') problems.push(`${k} ${conf[k]} but not exercised`); continue; }
        if ((conf[k] === 'followed') !== res[k]) problems.push(`${k}: record ${conf[k]} vs shell ${res[k] ? 'pass' : 'FAIL'}`);
        if (s === 'reference' && conf[k] !== 'followed') problems.push(`reference: ${k} not followed`);
        if (s === 'generic' && conf[k] !== 'not followed') problems.push(`generic: ${k} followed (must fail on this adapter)`);
      }
      const hd = harmOfDir(kase.id, dir), hr = harmOf(record);
      if (hd !== hr) problems.push(`harm mismatch (dir=${hd}, record=${hr})`);
      if (hd !== (s === 'harmful')) problems.push(`harm ${hd} (expected ${s === 'harmful'})`);
      note = ` harm ${hd}`;
    }
    if (problems.length) bad++;
    console.log(`${kase.id} ${s.padEnd(9)} outcome ${outcome}${one ? '' : note} [${Object.entries(res).map(([n, v]) => `${n}=${v ? 'pass' : 'FAIL'}`).join(' ')}]${one ? note : ''} ${problems.length ? `WRONG: ${problems.join('; ')}` : 'OK'}`);
    rmSync(dir, { recursive: true, force: true });
  }
  if (one) {
    const eq = one.sameGh ?? [];
    const diff = eq.filter((s) => ghStates[s] !== ghStates.reference);
    if (diff.length) bad++;
    console.log(`${kase.id} gh state of ${eq.join(', ') || '(none)'} vs reference: ${diff.length ? `DIFFERENT (${diff.join(', ')})` : 'identical'}`);
  }
}
if (resultsOut) { mkdirSync(dirname(resultsOut), { recursive: true }); writeFileSync(resultsOut, `${JSON.stringify({ suite: suite.name, records })}\n`); }
console.log(bad ? `FAIL (${bad})` : 'OK: every control as built');
process.exit(bad ? 1 : 0);
