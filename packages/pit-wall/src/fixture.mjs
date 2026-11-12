// The repository a case starts from, as a dated git history.
//
// A case may give `history: [{ date, message, files: {path: text|null} }]`, applied in
// order (null deletes). Without it, `files` become one commit. Dates are fixed so that
// `git log` and `git blame` tell the story the case needs (which decision is newer,
// when a premise changed), and the same story on every run.
//
// The final files are also returned as a state map, so graders can compare the run's
// end state with the start without reading the container.
//
// Branches (review cells): a history entry may carry `branch`. The first entry's `branch`
// names the default branch (git init's default differs between images). A later entry with
// another `branch` is committed on that branch — cut from the default branch's tip when it
// does not exist yet, stacked when it does — and the build returns to the default branch,
// so a PR's head lives at refs/heads/<topic> while the agent starts on the base. Entries
// without `branch` stay on the default branch; histories without any `branch` build as
// before, byte for byte.

import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const DEFAULT_DATE = '2026-01-05T10:00:00+00:00';
const body = (text) => `${text}\n`;

// Filler files that make a repository the size of a real one, so that a document has to
// be found rather than seen at a glance (`noise: { docs: n, modules: m }`). Deterministic:
// the same numbers give the same files. Topics are generic and say nothing about the task.
const TOPICS = ['caching', 'logging', 'deploy', 'onboarding', 'metrics', 'backups', 'search', 'queues', 'auth', 'billing-export', 'i18n', 'feature-flags'];
export function noiseFiles({ docs = 0, modules = 0 } = {}) {
  const files = {};
  for (let i = 0; i < docs; i++) {
    const t = TOPICS[i % TOPICS.length];
    files[`docs/guides/${t}-${String(i + 1).padStart(2, '0')}.md`] = `# ${t} notes ${i + 1}\nBackground on ${t} for operators. See the runbook section ${i + 1} for details.\nThis page is informational.`;
  }
  for (let i = 0; i < modules; i++) {
    const t = TOPICS[i % TOPICS.length];
    files[`lib/${t}/part-${String(i + 1).padStart(3, '0')}.sh`] = `#!/bin/bash\n# ${t} helper ${i + 1}\n${t.replace(/-/g, '_')}_${i + 1}() { echo "${t} ${i + 1}"; }`;
  }
  return files;
}

export function commits(kase) {
  const extra = kase.issue ? { [`.github-cache/issue-${kase.issue.number}.md`]: kase.issue.body } : {};
  Object.assign(extra, noiseFiles(kase.noise));
  for (const i of kase.issues ?? []) extra[`.github-cache/issue-${i.number}.md`] = i.body;
  for (const r of kase.prs ?? []) extra[`.github-cache/pr-${r.number}.md`] = r.body;
  if (kase.history?.length) {
    const [first, ...rest] = kase.history;
    // extra_files go last: a cell can replace a file of the shared history (EXP-14 B).
    return [{ ...first, files: { ...extra, ...first.files, ...(kase.extraFiles ?? {}) } }, ...rest];
  }
  return [{ date: DEFAULT_DATE, message: 'initial', files: { ...extra, ...kase.files, ...(kase.extraFiles ?? {}) } }];
}

// The default branch named by the history (null when it is left to git init).
export const defaultBranch = (list) => list[0]?.branch ?? null;
// Is this commit on the default branch (the tree the agent starts in)?
const onDefault = (c, def) => !c.branch || c.branch === def;
// Side-branch entries need a named default branch to return to.
function checkBranches(list) {
  const def = defaultBranch(list);
  if (!def && list.some((c) => c.branch)) throw new Error('fixture: a history with branch entries must name the default branch on its first entry');
  return def;
}

// path -> { sha256, text } of the repository before the agent runs (the default branch).
export function fixtureState(kase) {
  const files = {};
  const list = commits(kase);
  const def = checkBranches(list);
  for (const c of list) {
    if (!onDefault(c, def)) continue;
    for (const [p, t] of Object.entries(c.files)) {
      if (t === null) delete files[p]; else files[p] = body(t);
    }
  }
  return Object.fromEntries(Object.entries(files).map(([p, t]) => [p, { sha256: createHash('sha256').update(t).digest('hex'), text: t }]));
}

// Writes <dir>/fixture/: one directory per commit plus build.sh, which replays them.
// The index is rebuilt from content before each commit: `cp -a` keeps old mtimes, and
// git then missed same-size edits (900 -> 910 in a test, found 2026-11-01 by the host
// head check). Replays them
// into /app with fixed author and committer dates and records the fixture head.
export function writeFixture(dir, kase) {
  const root = join(dir, 'fixture');
  const list = commits(kase);
  const def = checkBranches(list);
  const lines = ['#!/bin/bash', 'set -euo pipefail', 'mkdir -p /app /etc/pitwall && cd /app && git init -q .'];
  list.forEach((c, i) => {
    const n = String(i).padStart(3, '0');
    const side = !onDefault(c, def);
    if (side) lines.push(`git checkout -q '${c.branch}' 2>/dev/null || git checkout -q -b '${c.branch}'`);
    for (const [p, t] of Object.entries(c.files)) {
      if (t === null) { lines.push(`git rm -q --cached -- '${p}' && rm -f -- '${p}'`); continue; }
      mkdirSync(join(root, n, p, '..'), { recursive: true });
      writeFileSync(join(root, n, p), body(t));
    }
    writeFileSync(join(root, `${n}.msg`), `${c.message}\n`);
    lines.push(`[ -d /fixture/${n} ] && cp -a /fixture/${n}/. /app/ || true`,
      `find /app -path /app/.git -prune -o -type f -exec chmod 644 {} + && { git rm -r -q --cached . >/dev/null 2>&1 || true; } && git add -A && GIT_AUTHOR_DATE='${c.date}' GIT_COMMITTER_DATE='${c.date}' git -c user.name='${c.author ?? 'fixture'}' -c user.email=fixture@example.com commit -q --allow-empty -F /fixture/${n}.msg`);
    // The default branch is named after the first commit (git branch -M needs one).
    if (i === 0 && def) lines.push(`git branch -M '${def}'`);
    if (side) lines.push(`git checkout -q '${def}'`);
  });
  // checkout: { branch, at } leaves the agent on a branch cut from an earlier commit (the
  // commit whose message is `at`), as with a stale base (I-12). The recorded head is that
  // commit: an ancestor of both the branch and the full history.
  // The history's branch is named main first: `git init` in the image may default to master,
  // and the case's request and checks name main (EXP-24 controls failed on this).
  if (kase.checkout) lines.push('git branch -M main');
  if (kase.checkout) lines.push(`git checkout -q -b '${kase.checkout.branch}' "$(git log --format=%H --grep='^${kase.checkout.at}$' -1)"`);
  lines.push('git rev-parse HEAD > /etc/pitwall/fixture-head');
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, 'build.sh'), `${lines.join('\n')}\n`, { mode: 0o755 });
}

// The fixture's final commit id, computed outside the sandbox. Commits have fixed
// content, author, committer and dates, so the id is determined by the case. The
// sandbox also records the id it built (/etc/pitwall/fixture-head), but an agent
// running as root can rewrite that file; comparing it with this value closes the gap.
// `executable` replays builds made before file modes were normalised (fixtures written
// on a Windows drive under WSL came out 0755): both ids are fixed by the case.
export function expectedHead(kase, { executable = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'pitwall-head-'));
  const git = (args, env = {}) => execFileSync('git', ['-c', 'core.autocrlf=false', '-c', 'core.fileMode=false', '-c', 'commit.gpgsign=false', ...args], { cwd: dir, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
  try {
    git(['init', '-q', '.']);
    const list = commits(kase);
    const def = checkBranches(list);
    list.forEach((c, i) => {
      const side = !onDefault(c, def);
      if (side) { try { git(['checkout', '-q', c.branch]); } catch { git(['checkout', '-q', '-b', c.branch]); } }
      for (const [p, t] of Object.entries(c.files)) {
        const f = join(dir, p);
        if (t === null) { rmSync(f, { force: true }); continue; }
        mkdirSync(dirname(f), { recursive: true });
        writeFileSync(f, body(t));
      }
      const msg = join(dir, '.git', 'PITWALL_MSG');
      writeFileSync(msg, `${c.message}\n`);
      git(['add', '-A']);
      if (executable) {
        const all = git(['ls-files']).split('\n').filter(Boolean);
        if (all.length) git(['update-index', '--chmod=+x', '--', ...all]);
      }
      git(['-c', `user.name=${c.author ?? 'fixture'}`, '-c', 'user.email=fixture@example.com', 'commit', '-q', '--allow-empty', '-F', msg], { GIT_AUTHOR_DATE: c.date, GIT_COMMITTER_DATE: c.date });
      if (i === 0 && def) git(['branch', '-M', def]);
      if (side) git(['checkout', '-q', def]);
    });
    if (kase.checkout) return git(['log', '--format=%H', `--grep=^${kase.checkout.at}$`, '-1']);
    return git(['rev-parse', 'HEAD']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
