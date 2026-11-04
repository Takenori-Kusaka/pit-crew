// Local check of the held-out cells before any Harbor run (WSL). For each case and scripted control:
// replay the fixture, run the script, run the checks, derive the outcome and compare it with
// script_expect; then apply the harm predicate to the reference and harmful controls in both ways
// harm-run.mjs does (harmOf on a record built from the final state for B; harmOfDir on a copy of the
// final files without .git for A, C, D) and require reference = no harm, harmful = harm.
// Prints only case id, control and pass/fail. Usage (WSL): node experiments/heldout-s5/check-controls.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { loadSuite } from '../../packages/pit-wall/src/suite.mjs';
import { commits } from '../../packages/pit-wall/src/fixture.mjs';
import { harmOf, harmOfDir } from './harm.mjs';
import { typeOf } from './gen-heldout.mjs';

const suite = loadSuite(process.argv[2] ?? 'suites/heldout-s5/suite.yaml');
const env = { ...process.env, GIT_AUTHOR_NAME: 'a', GIT_AUTHOR_EMAIL: 'a@e', GIT_COMMITTER_NAME: 'a', GIT_COMMITTER_EMAIL: 'a@e' };
const sh = (cmd, cwd) => { try { execFileSync('bash', ['-c', cmd], { cwd, stdio: 'ignore', env, timeout: 60000 }); return true; } catch { return false; } };
let bad = 0;
for (const kase of suite.cases) {
  for (const s of Object.keys(kase.scripts)) {
    const dir = mkdtempSync(join(tmpdir(), 'h5-cell-'));
    const git = (...a) => execFileSync('git', ['-c', 'commit.gpgsign=false', ...a], { cwd: dir, env, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    git('init', '-q', '-b', 'master', '.');
    for (const c of commits(kase)) {
      for (const [p, t] of Object.entries(c.files)) { const f = join(dir, p); if (t === null) { rmSync(f, { force: true }); continue; } mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, t.endsWith('\n') ? t : `${t}\n`); }
      git('add', '-A');
      execFileSync('git', ['commit', '-q', '--allow-empty', '-m', c.message], { cwd: dir, env: { ...env, GIT_AUTHOR_DATE: c.date, GIT_COMMITTER_DATE: c.date } });
    }
    rmSync('/tmp/.verify-runs.log', { force: true });
    const ran = sh(kase.scripts[s], dir);
    const res = Object.fromEntries(Object.entries(kase.checks).map(([n, c]) => [n, sh(c, dir)]));
    const conv = Object.keys(res).filter((n) => n !== 'task');
    const outcome = !res.task ? 'task-failed' : conv.every((n) => res[n]) ? 'all-followed' : 'some-followed';
    const okOutcome = ran && outcome === kase.scriptExpect[s];
    let harmNote = '';
    let okHarm = true;
    if (s === 'reference' || s === 'harmful') {
      const want = s === 'harmful';
      let h;
      if (typeOf(kase.id) === 'b') {
        const files = {};
        const walk = (d) => { for (const n of readdirSync(d)) { if (n === '.git') continue; const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else files[relative(dir, p)] = { text: readFileSync(p, 'utf8') }; } };
        walk(dir);
        const log = git('log', '--format=%s').split('\n').filter(Boolean).map((message) => ({ message }));
        const h1 = harmOf({ case: kase.id, state: { files, git: { log }, commands: { gh: [] } }, outcome });
        const h2 = harmOfDir(kase.id, dir);
        h = h1 === h2 ? h1 : `mismatch(${h1},${h2})`;
      } else {
        const copy = mkdtempSync(join(tmpdir(), 'h5-copy-'));
        execFileSync('bash', ['-c', `tar -C '${dir}' --exclude=.git -cf - . | tar -C '${copy}' -xf -`]);
        h = harmOfDir(kase.id, copy);
        rmSync(copy, { recursive: true, force: true });
      }
      okHarm = h === want;
      harmNote = ` harm ${okHarm ? 'pass' : 'FAIL'}`;
    }
    if (!okOutcome || !okHarm) bad++;
    console.log(`${kase.id} ${s.padEnd(9)} outcome ${okOutcome ? 'pass' : 'FAIL'}${harmNote}`);
    rmSync(dir, { recursive: true, force: true });
  }
}
console.log(bad ? `FAIL (${bad})` : 'OK');
process.exit(bad ? 1 : 0);
