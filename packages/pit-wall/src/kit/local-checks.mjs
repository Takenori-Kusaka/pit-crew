// A fixture's named checks (`checks: { <name>: <command> }`), run on a scripted control's end tree WITHOUT a
// container. In a Harbor task the verifier runs them in /app after the agent (runners/harbor.mjs tests/checks.sh);
// the self-check without a container had no result for them, so a row that reads one (check_passes) was
// undecidable for every control. Here the same commands run in a temporary git repository:
//   one commit = the tree at the start (as the fixture repository has), working tree = the tree at the end.
// The fixture's own `check` (checks_pass) is run the same way (`localAllChecks`): before, a control built to pass
// was taken to leave it passing and every other control to leave it failing, whatever its files did — so an
// incident that makes the check pass by rewriting an expectation was read as "handed back on red" and never as
// "green, but the start's tests fail" (the reverse of what the container sees). No docker, no model.
//
// What this does not show: the image (its runtime, its tools), the user the verifier runs as, the commits a control
// script makes (the end tree is left uncommitted on top of the first commit), and anything a check reads outside
// the repository. The docker self-check observes the real ones.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { shellCommands } from './predicates.mjs';

// The POSIX bash to use. PITWALL_BASH (or the tests' PITWALL_TEST_BASH) wins. On Windows there is no default that
// is safe to assume (System32's bash is WSL and does not take Windows paths), so Git for Windows' bash is looked
// for in its usual places; when there is none the answer is null and the checks stay unobserved.
let found;
export function localBash() {
  const env = process.env.PITWALL_BASH || process.env.PITWALL_TEST_BASH;
  if (env) return env;
  if (process.platform !== 'win32') return 'bash';
  if (found !== undefined) return found;
  const roots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Programs')].filter(Boolean);
  found = roots.map((r) => join(r, 'Git', 'bin', 'bash.exe')).find((p) => existsSync(p)) ?? null;
  return found;
}

export const namedChecks = (checks) => Object.entries(checks ?? {}).filter(([n]) => n !== 'check');

// checks: the case's checks (name -> command; `check` is skipped). before / after: { path: text } of the whole
// repository at the start and at the end. Returns { <name>: exit code | null } (null = the command did not end:
// a timeout or a signal), or null when there is no named check or no bash (nothing was observed).
export const localChecks = (checks, before, after, bash = localBash()) => runChecks(namedChecks(checks), before, after, bash);
// The same with the fixture's own `check` first, as the verifier runs them (check, then the named ones, in order).
export const localAllChecks = (checks, before, after, bash = localBash()) => runChecks(Object.entries(checks ?? {}).sort((a, b) => (b[0] === 'check') - (a[0] === 'check')), before, after, bash);
function runChecks(named, before, after, bash) {
  if (!named.length || !bash) return null;
  return localRun({ checks: named, start: before, end: after, bash })?.checks ?? null;
}

// git subcommands a scripted control's Bash steps may run in the temporary repository (they move refs or the tree).
// Nothing else of a step is run here: no network, no gh, no test command, no other program. `push`, `fetch`, `pull`
// and `clone` need a remote and are left out (the docker self-check observes them).
const GIT_LOCAL = new Set(['add', 'branch', 'checkout', 'cherry-pick', 'commit', 'merge', 'mv', 'rebase', 'reset', 'restore', 'revert', 'rm', 'stash', 'switch', 'tag']);
// The default branch of the temporary repository. The task image makes the fixture repository with git's own default.
export const LOCAL_MAIN = 'master';

// The local run of one scripted control (or of a given end tree):
//   checks  [[name, command], ...] run on the end tree, in this order (may be empty)
//   start   { path: text } the repository at the start (its one commit)
//   end     { path: text } the end tree, written as it is — OR —
//   events  the control's events, replayed in order: an Edit / Write writes its file; a Bash step runs its LOCAL git
//           commands (GIT_LOCAL) as the step's command line splits into simple commands. So the branch the script
//           works on, the commits it makes and a merge into the mainline are real, and the refs before and after
//           can be read — the facts a row like "the mainline moved to the agent's own commit" needs.
// Returns { checks: { name: exit | null }, git: { branch, head, base_head, refs_before, refs_after } | undefined
//           (only with `events`), not_replayed: [commands left out] } — or null without a bash.
const cache = new Map();
export function localRun({ checks = [], start, end = null, events = null, bash = localBash() }) {
  if (!bash) return null;
  const steps = events ? events.map((e) => [e.tool, e.path ?? null, ['Edit', 'Write'].includes(e.tool) ? e.new : null, e.tool === 'Bash' ? e.command : null]) : null;
  const key = createHash('sha256').update(JSON.stringify([bash, checks, Object.entries(start).sort(), end ? Object.entries(end).sort() : null, steps])).digest('hex');
  if (cache.has(key)) return cache.get(key);
  const T = mkdtempSync(join(tmpdir(), 'kit-checks-')), app = join(T, 'app');
  const put = (root, files) => { for (const [p, text] of Object.entries(files)) { if (typeof text !== 'string') continue; mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), text); } };
  const { NODE_TEST_CONTEXT: _c, ...env0 } = process.env;   // with it, a nested `node --test` exits 0 whatever its tests do
  const env = { ...env0, GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0', GIT_AUTHOR_NAME: 'fixture', GIT_AUTHOR_EMAIL: 'fixture@example.com', GIT_COMMITTER_NAME: 'fixture', GIT_COMMITTER_EMAIL: 'fixture@example.com' };
  const sh = (args, timeout) => spawnSync(bash, args, { cwd: app, encoding: 'utf8', env, timeout, maxBuffer: 16 << 20 });
  const git = (args) => spawnSync('git', args, { cwd: app, encoding: 'utf8', env, timeout: 60000, maxBuffer: 16 << 20 });
  const refs = () => Object.fromEntries((git(['for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads']).stdout ?? '').split('\n').filter(Boolean).map((l) => l.split(' ')));
  try {
    mkdirSync(app, { recursive: true });
    put(app, start);
    const init = sh(['-c', `git init -q -b ${LOCAL_MAIN} . && git config core.autocrlf false && git config core.fileMode false && git add -A && git commit -q -m initial`]);
    if (init.error || init.status !== 0) throw new Error(`local checks: the start repository could not be made with ${bash}: ${init.error?.message ?? init.stderr}`);
    const out = { checks: {}, not_replayed: [] };
    if (end) {
      for (const p of Object.keys(start)) if (!(p in end)) rmSync(join(app, p), { force: true });
      put(app, end);
    } else {
      const base_head = git(['rev-parse', 'HEAD']).stdout.trim(), refs_before = refs();
      for (const e of events) {
        if (['Edit', 'Write'].includes(e.tool) && typeof e.new === 'string') { put(app, { [e.path]: `${e.new}\n` }); continue; }
        if (e.tool !== 'Bash' || typeof e.command !== 'string') continue;
        for (const c of shellCommands(e.command)) {
          const w = c.words ?? [];
          if (w[0] !== 'git') continue;
          if (!GIT_LOCAL.has(w[1])) { if (!/^(status|diff|log|show|rev-parse|ls-files|blame|config|remote|describe|grep|shortlog|reflog|cat-file|for-each-ref)$/.test(w[1] ?? '')) out.not_replayed.push(c.line ?? w.join(' ')); continue; }
          git(w.slice(1));                    // a failing git command fails here as it would in the script: the refs say what happened
        }
      }
      out.git = { branch: git(['symbolic-ref', '--short', '-q', 'HEAD']).stdout.trim() || undefined, head: git(['rev-parse', 'HEAD']).stdout.trim(), base_head, refs_before, refs_after: refs() };
    }
    checks.forEach(([name, cmd], k) => {
      writeFileSync(join(T, `check-${k}.sh`), String(cmd).replace(/\r\n/g, '\n'));
      const r = sh([join(T, `check-${k}.sh`).replace(/\\/g, '/')], 120000);
      out.checks[name] = Number.isInteger(r.status) ? r.status : null;
    });
    cache.set(key, out);
    return out;
  } finally { rmSync(T, { recursive: true, force: true }); }
}
// every check of a case, the fixture's own `check` first (the order the verifier runs them in)
export const orderedChecks = (checks) => Object.entries(checks ?? {}).sort((x, y) => (y[0] === 'check') - (x[0] === 'check'));
