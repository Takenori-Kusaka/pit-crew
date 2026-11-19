// Builds a cell's repository on the host exactly as fixture.mjs builds it in the image: one commit
// per history entry, fixed dates, files as text + newline, mode 644, side-branch entries (the PR's
// head) cut from the default branch and the checkout returned to it. Shared by gen-qm.mjs (to
// compute diff-N.patch) and check-controls.mjs (to run the scripted controls).
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { commits, defaultBranch } from '../../packages/pit-wall/src/fixture.mjs';

const GIT_CFG = ['-c', 'core.autocrlf=false', '-c', 'core.fileMode=false', '-c', 'commit.gpgsign=false', '-c', 'user.name=fixture', '-c', 'user.email=fixture@example.com'];

export function git(dir, args, env = {}) {
  return execFileSync('git', [...GIT_CFG, ...args], { cwd: dir, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
}

// kase: anything commits() accepts ({ history, issue, extraFiles, ... }). Returns the directory.
export function buildRepo(kase) {
  const dir = mkdtempSync(join(tmpdir(), 'qm-cell-'));
  const list = commits(kase);
  const def = defaultBranch(list);
  git(dir, ['init', '-q', '-b', 'master', '.']); // as in the image: not main
  list.forEach((c, i) => {
    const side = !!c.branch && c.branch !== def;
    if (side) { try { git(dir, ['checkout', '-q', c.branch]); } catch { git(dir, ['checkout', '-q', '-b', c.branch]); } }
    for (const [p, t] of Object.entries(c.files)) {
      const f = join(dir, p);
      if (t === null) { rmSync(f, { force: true }); continue; }
      mkdirSync(dirname(f), { recursive: true });
      writeFileSync(f, `${t}\n`, { mode: 0o644 });
    }
    git(dir, ['add', '-A']);
    git(dir, ['commit', '-q', '--allow-empty', '-m', c.message], { GIT_AUTHOR_DATE: c.date, GIT_COMMITTER_DATE: c.date });
    if (i === 0 && def) git(dir, ['branch', '-M', def]);
    if (side) git(dir, ['checkout', '-q', def]);
  });
  return dir;
}

// The PR's diff as the agent would see it with `git diff <base>...<head>` (default options, no colour).
export const threeDotDiff = (dir, base, head) => execFileSync('git', ['-c', 'core.autocrlf=false', '-c', 'color.ui=never', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', `${base}...${head}`], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
export const threeDotNames = (dir, base, head) => git(dir, ['diff', '--name-only', `${base}...${head}`]).split('\n').filter(Boolean);

// path -> text of the working tree (without .git).
export function readDir(dir) {
  const out = {};
  const walk = (d) => { for (const n of readdirSync(d)) { if (n === '.git') continue; const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else out[relative(dir, p).replace(/\\/g, '/')] = readFileSync(p, 'utf8'); } };
  walk(dir);
  return out;
}
