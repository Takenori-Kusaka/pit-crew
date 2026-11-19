// Replay each case of a suite into a temporary git repository (with `checkout` when set),
// run each scripted control, and run every check (task and conventions) on the result.
// A quick local check before the Harbor controls; it does not replace them.
// Usage (WSL): node experiments/structure/check-cells.mjs <suite>
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { loadSuite } from '../../packages/pit-wall/src/suite.mjs';
import { commits } from '../../packages/pit-wall/src/fixture.mjs';

const suite = loadSuite(process.argv[2]);
for (const kase of suite.cases) {
  const build = () => {
    const dir = mkdtempSync(join(tmpdir(), 'pitwall-cell-'));
    const git = (...a) => execFileSync('git', ['-c', 'commit.gpgsign=false', '-c', 'user.name=f', '-c', 'user.email=f@e', ...a], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    git('init', '-q', '-b', 'master', '.'); // as in the image: not main
    for (const c of commits(kase)) {
      for (const [p, t] of Object.entries(c.files)) { const f = join(dir, p); if (t === null) { rmSync(f, { force: true }); continue; } mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, t.endsWith('\n') ? t : `${t}\n`); }
      git('add', '-A');
      execFileSync('git', ['-c', 'user.name=f', '-c', 'user.email=f@e', 'commit', '-q', '--allow-empty', '-m', c.message], { cwd: dir, env: { ...process.env, GIT_AUTHOR_DATE: c.date, GIT_COMMITTER_DATE: c.date } });
    }
    if (kase.checkout) git('branch', '-M', 'main');
    if (kase.checkout) git('checkout', '-q', '-b', kase.checkout.branch, git('log', '--format=%H', `--grep=^${kase.checkout.at}$`, '-1').trim());
    return dir;
  };
  // gh is pit-wall's stand-in, first on PATH, as in the Harbor image (/usr/local/bin/gh).
  const shimDir = mkdtempSync(join(tmpdir(), 'pitwall-gh-'));
  writeFileSync(join(shimDir, 'gh'), readFileSync(new URL('../../packages/pit-wall/shims/gh', import.meta.url), 'utf8').replace(/\r\n/g, '\n'), { mode: 0o755 });
  writeFileSync(join(shimDir, 'pitwall-mark-run'), readFileSync(new URL('../../packages/pit-wall/shims/mark-run.sh', import.meta.url), 'utf8').replace(/\r\n/g, '\n'), { mode: 0o755 });
  // Without state-capture's PITWALL_FINAL_TREE it hashes the cell's tree when the check runs.
  writeFileSync(join(shimDir, 'pitwall-ran-on-final'), readFileSync(new URL('../../packages/pit-wall/shims/ran-on-final.sh', import.meta.url), 'utf8').replace(/\r\n/g, '\n'), { mode: 0o755 });
  // As in state-capture.sh: what a check runs does not write to the agent's effect files.
  const CHECK_ENV = { PITWALL_GH_STATE: '/tmp/pitwall-gh-state.checks.json', PITWALL_RUNS_LOG: '/tmp/pitwall-runs.checks.log' };
  const sh = (cmd, dir, extra = {}) => { try { execFileSync('bash', ['-c', cmd], { cwd: dir, stdio: 'ignore', env: { ...process.env, PATH: `${shimDir}:${process.env.PATH}`, GIT_AUTHOR_NAME: 'a', GIT_AUTHOR_EMAIL: 'a@e', GIT_COMMITTER_NAME: 'a', GIT_COMMITTER_EMAIL: 'a@e', ...extra } }); return true; } catch { return false; } };
  for (const s of Object.keys(kase.scripts)) {
    const dir = build();
    try { execFileSync('bash', ['-c', 'rm -f /tmp/.verify-runs.log /tmp/pitwall-gh.log /tmp/pitwall-gh-state.* /tmp/pitwall-runs.log /tmp/pitwall-runs.checks.log']); } catch {}
    const ran = sh(kase.scripts[s], dir);
    const res = Object.entries(kase.checks).map(([n, c]) => `${n}=${sh(c, dir, CHECK_ENV) ? 'pass' : 'FAIL'}`).join(' ');
    console.log(`${kase.id} ${s.padEnd(9)} script ${ran ? 'ok ' : 'ERR'} -> ${res} (expected outcome ${kase.scriptExpect[s]})`);
    rmSync(dir, { recursive: true, force: true });
  }
}
