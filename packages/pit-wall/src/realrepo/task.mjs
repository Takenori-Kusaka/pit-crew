// Real-repository tasks (plan 34 §9 instruments 2, 3, 6): a task is a POINTER to a public
// repository — { repo, pre-fix commit, reference fix commit, hidden check paths } — and is
// materialised from a local clone into docker build contexts and Harbor task directories under
// a git-ignored directory. Nothing of the repository's content is written by this module to
// anywhere but `outDir` (keep it under local/).
//
// Images (layered so that dependencies are installed once per lock file):
//   pitwall/realrepo-node:<node version>   agent image + node + the run recorder (node wrapper)
//   pitwall/realrepo-deps:<lock hash>      + /app/node_modules from package.json / package-lock.json
//   pitwall/realrepo-tree:<task>-<abc|d>   + the pre-fix tree as one git commit in /app
// Arms: A, B, C share the tree with the harness files removed (abc); D keeps everything (d).
//   A nothing added. B the same tree + one requirements document (a parameter; written by
//   another role) placed as CLAUDE.md and hidden from git. C the same tree + a skill directory
//   passed with --skill and the entry command in front of the instruction (as EXP-32:
//   `path:<skills>@/dev`). D "as is".
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { hashesOfTrees, keysOf } from './gq-content.mjs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ARMS = ['A', 'B', 'C', 'D'];
export const treeKind = (arm) => (arm === 'D' ? 'd' : 'abc');
const SHA = /^[0-9a-f]{40}$/;
export const TEST_FILE = /(^|\/)[^/]+\.(test|spec)\.[cm]?[jt]sx?$/;
const SHIMS = fileURLToPath(new URL('../../shims/realrepo/', import.meta.url));
const shim = (name) => readFileSync(join(SHIMS, name), 'utf8').replace(/\r\n/g, '\n');

// verifier: measured 227 s for capture + hidden checks with 142 sibling test files (G4, 2026-11-13);
// the limits leave about 2.5x. The first runner's 120 s (runners/harbor.mjs) is too short here.
export const DEFAULT_LIMITS = { build_sec: 900, agent_sec: 1800, verifier_sec: 1500, hidden_sec: 600, q4_sec: 300 };

export function validateTask(t) {
  const e = [];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(String(t?.id ?? ''))) e.push('id must be lower-case letters, digits and dashes');
  if (!/^[\w.-]+\/[\w.-]+$/.test(String(t?.repo ?? ''))) e.push('repo must be owner/name');
  for (const k of ['prefix_commit', 'reference_commit']) if (!SHA.test(String(t?.[k] ?? ''))) e.push(`${k} must be a 40-hex commit id`);
  if (!Array.isArray(t?.hidden_checks) || !t.hidden_checks.length) e.push('hidden_checks must list at least one path');
  for (const k of ['hidden_checks', 'sibling_tests', 'impl_files', 'source_paths']) for (const p of t?.[k] ?? []) if (typeof p !== 'string' || p.startsWith('/') || p.split('/').includes('..')) e.push(`${k}: bad path ${JSON.stringify(p)}`);
  return e;
}
export function loadTask(file) {
  const t = JSON.parse(readFileSync(file, 'utf8'));
  const e = validateTask(t);
  if (e.length) throw new Error(`invalid task ${file}:\n  - ${e.join('\n  - ')}`);
  return { sibling_tests: [], impl_files: [], source_paths: ['src', 'tests'], ...t, limits: { ...DEFAULT_LIMITS, ...(t.limits ?? {}) } };
}

const git = (gitDir, args, opts = {}) => {
  const r = spawnSync('git', ['-c', 'core.quotepath=false', '-c', 'core.autocrlf=false', '-c', 'core.eol=lf', ...args], { cwd: gitDir, maxBuffer: 1 << 30, ...opts });
  if (r.status !== 0) throw new Error(`git ${args.slice(0, 2).join(' ')} failed: ${String(r.stderr).slice(0, 300)}`);
  return r.stdout;
};
const lines = (buf) => buf.toString('utf8').split('\n').filter(Boolean);

// Does a harness pattern (harness-files.json) match a path?
export function matches(pattern, path) {
  if (pattern.endsWith('/')) return path.startsWith(pattern);
  if (pattern.startsWith('**/')) { const n = pattern.slice(3); return path === n || path.endsWith(`/${n}`); }
  return path === pattern;
}
// The tracked paths of a tree that the harness list removes.
export function removedPaths(paths, harness) {
  const pats = (harness.remove ?? harness).map((h) => (typeof h === 'string' ? h : h.pattern));
  return paths.filter((p) => pats.some((pat) => matches(pat, p)));
}

// Directories left with no file once `removed` is gone: their names alone would tell what was
// there (one directory per skill), so they are taken out of the archive as well.
export function emptiedDirs(all, removed) {
  const gone = new Set(removed);
  const kept = new Set();
  for (const p of all) if (!gone.has(p)) { const parts = p.split('/'); for (let i = 1; i < parts.length; i++) kept.add(parts.slice(0, i).join('/')); }
  const out = new Set();
  for (const p of removed) { const parts = p.split('/'); for (let i = 1; i < parts.length; i++) { const d = parts.slice(0, i).join('/'); if (!kept.has(d)) out.add(d); } }
  return [...out].sort((a, b) => b.length - a.length); // deepest first
}

// The mechanical part of a task, from the two commits: what the reference fix changed.
export function deriveTask(gitDir, prefix, reference) {
  const changed = lines(git(gitDir, ['diff', '--name-status', '--no-renames', prefix, reference])).map((l) => { const [s, ...p] = l.split('\t'); return { status: s, path: p.join('\t') }; });
  const tree = new Set(lines(git(gitDir, ['ls-tree', '-r', '--name-only', prefix])));
  const tests = changed.filter((c) => TEST_FILE.test(c.path) && c.status !== 'D').map((c) => c.path);
  const dirs = new Set(tests.map((p) => dirname(p)));
  return {
    hidden_checks: tests,
    hidden_new: tests.filter((p) => !tree.has(p)),
    impl_files: changed.filter((c) => !TEST_FILE.test(c.path) && c.status !== 'D').map((c) => c.path),
    sibling_tests: [...tree].filter((p) => TEST_FILE.test(p) && dirs.has(dirname(p)) && !tests.includes(p)).sort(),
    changed: changed.length,
  };
}

const sha12 = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 12);
export const nodeImage = (nodeVersion) => `pitwall/realrepo-node:${nodeVersion}`;
export const depsImage = (lockHash) => `pitwall/realrepo-deps:${lockHash}`;
export const treeImage = (task, arm) => `pitwall/realrepo-tree:${task.id}-${treeKind(arm)}`;

export const nodeDockerfile = (base, nodeVersion, { buildTools = false } = {}) => `FROM ${base}
# node for the subject repository. The real binary lives off PATH; in this layer and the next
# (dependency install) /usr/local/bin/node is a plain link to it. The task layer replaces the
# link with the recording wrapper (shims/realrepo), last, so that a change of the recorder
# rebuilds only that layer.
RUN apt-get update && apt-get install -y --no-install-recommends xz-utils${buildTools ? ' python3 make g++' : ''} && rm -rf /var/lib/apt/lists/* \\
 && curl -fsSL https://nodejs.org/dist/v${nodeVersion}/node-v${nodeVersion}-linux-x64.tar.xz -o /tmp/node.tar.xz \\
 && mkdir -p /opt/pitwall/node /opt/pitwall/rec /var/pitwall/rec && tar -xJf /tmp/node.tar.xz -C /opt/pitwall/node --strip-components=1 && rm /tmp/node.tar.xz \\
 && chmod 1777 /var/pitwall/rec \\
 && ln -s /opt/pitwall/node/bin/node /usr/local/bin/node \\
 && ln -s /opt/pitwall/node/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \\
 && ln -s /opt/pitwall/node/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \\
 && node --version && npm --version
`;

// The root "prepare" script needs the repository's own files, which are not in this layer:
// install without scripts, then run the dependencies' install scripts (native prebuilds).
export const depsDockerfile = (nodeRef) => `FROM ${nodeRef}
WORKDIR /app
COPY package.json package-lock.json .npmrc /app/
RUN HUSKY=0 npm ci --ignore-scripts --no-audit --no-fund \\
 && npm rebuild --no-audit --no-fund \\
 && npm cache clean --force && rm -rf /root/.npm /tmp/* /var/pitwall/rec/*
`;

// One commit from the pre-fix tree. No history and no remote in any arm (harness-files.json).
// The repository with its history up to the pre-fix commit (dotgit.tar: a fresh fetch of that
// one commit, so nothing later is in the object store), checked out here. No remote, no tag,
// no other branch, no reflog.
// gh: the stand-in (shims/realrepo/gh.mjs) with the task's frozen snapshot. graphify: the CLI the
// project's harness uses with graphify-out/ (PyPI graphifyy, Apache-2.0; needs python).
export const treeDockerfile = (depsRef, date, { sync = true, gh = false, jq = false, graphifyVersion = null } = {}) => `FROM ${depsRef}
ADD dotgit.tar /app/
RUN cd /app && git reset -q --hard main && rm -rf .git/logs .git/FETCH_HEAD .git/ORIG_HEAD \\
 && test -z "$(git status --porcelain --untracked-files=no)" \\
 && mkdir -p /etc/pitwall && git rev-parse HEAD > /etc/pitwall/fixture-head \\
 && git config --system user.name agent && git config --system user.email agent@example.com \\
 ${sync ? '&& (npx svelte-kit sync >/dev/null 2>&1 || true) ' : ''}&& rm -rf /var/pitwall/rec/* /root/.npm
${graphifyVersion ? `RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip && pip3 install --break-system-packages --no-cache-dir graphifyy==${graphifyVersion} && rm -rf /var/lib/apt/lists/* /root/.cache && graphify --help >/dev/null\n` : ''}COPY pitwall-rec/ /opt/pitwall/rec/
RUN rm -f /usr/local/bin/node && cp /opt/pitwall/rec/node-wrapper.sh /usr/local/bin/node && chmod 755 /usr/local/bin/node && node --version
${gh ? `COPY pitwall-gh/ /opt/pitwall/gh/\nRUN printf '#!/bin/sh\\nexec /opt/pitwall/node/bin/node /opt/pitwall/gh/gh.mjs "$@"\\n' > /usr/local/bin/gh && chmod 755 /usr/local/bin/gh && mkdir -p /var/pitwall/gh && chmod 1777 /var/pitwall/gh${jq ? ' && mv /opt/pitwall/gh/jq /usr/local/bin/jq && chmod 755 /usr/local/bin/jq' : ''} && gh --version\n` : ''}WORKDIR /app
`;

// The filtered commit that stands for an original commit (git-filter-repo's commit-map). A commit
// that touched only removed paths is pruned by the filter: its nearest surviving first-parent
// ancestor stands for it (the tree is the same once the removed paths are gone; checked by the caller).
export function mappedCommit(filteredDir, origDir, commit) {
  const map = new Map(readFileSync(join(filteredDir, 'filter-repo', 'commit-map'), 'utf8').split('\n').map((l) => l.split(' ')).filter((p) => p.length === 2));
  for (const c of lines(git(origDir, ['rev-list', '--first-parent', commit]))) {
    const m = map.get(c);
    if (m && !/^0+$/.test(m)) return { commit: m, via: c, pruned: c !== commit };
  }
  throw new Error(`no filtered commit for ${commit}`);
}

const fileUrl = (p) => { const s = String(p).replace(/\\/g, '/'); return s.startsWith('/') ? `file://${s}` : `file:///${s}`; };

// Write <dir>/dotgit.tar: a repository whose only ref is main = `commit`, fetched fresh from
// `source` (so its object store holds what that commit reaches and nothing else), with
// `depth` commits of history (0 = all). Returns counts and sizes.
export function writeHistory(dir, { source, commit, depth = 0 }) {
  const repo = join(dir, 'repo');
  rmSync(repo, { recursive: true, force: true });
  mkdirSync(repo, { recursive: true });
  const tmp = `exp48-tmp-${process.pid}-${commit.slice(0, 12)}`;
  git(repo, ['init', '-q', '-b', 'main', '.']);
  git(source, ['update-ref', `refs/heads/${tmp}`, commit]);
  try { git(repo, ['fetch', '-q', '--no-tags', '--update-head-ok', ...(depth ? ['--depth', String(depth)] : []), fileUrl(source), `refs/heads/${tmp}:refs/heads/main`]); } finally { git(source, ['update-ref', '-d', `refs/heads/${tmp}`]); }
  if (git(repo, ['rev-parse', 'refs/heads/main']).toString('utf8').trim() !== commit) throw new Error('history: main is not the wanted commit');
  // A plain configuration, whatever platform wrote the repository.
  writeFileSync(join(repo, '.git', 'config'), '[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false\n\tlogallrefupdates = true\n');
  for (const p of ['logs', 'FETCH_HEAD', 'hooks', 'description', 'info/exclude']) rmSync(join(repo, '.git', p), { recursive: true, force: true });
  mkdirSync(join(repo, '.git', 'info'), { recursive: true });
  writeFileSync(join(repo, '.git', 'info', 'exclude'), '');
  const refs = lines(git(repo, ['for-each-ref', '--format=%(refname)']));
  if (refs.join(',') !== 'refs/heads/main') throw new Error(`history: unexpected refs ${refs.join(',')}`);
  const commits = Number(git(repo, ['rev-list', '--count', 'main']).toString('utf8').trim());
  const r = spawnSync('tar', ['-cf', 'dotgit.tar', '-C', 'repo', '.git'], { cwd: dir });
  if (r.status !== 0) throw new Error(`tar failed: ${String(r.stderr).slice(0, 200)}`);
  const treeLines = git(repo, ['ls-tree', '-r', 'main']).toString('utf8');
  rmSync(repo, { recursive: true, force: true });
  return { commits, depth, shallow: !!depth, tarBytes: statSync(join(dir, 'dotgit.tar')).size, treeLines };
}

// How many commits of the history given to the agent mention the task's issue or its fix PR
// (a count: the reviewer judges whether the history points at the fix).
export function historyMentions(gitDir, commit, numbers, depth = 0) {
  const ns = numbers.filter((n) => Number.isInteger(n));
  if (!ns.length) return null;
  const re = `#(${ns.join('|')})([^0-9]|$)`;
  return lines(git(gitDir, ['log', '--format=%H', '-E', `--grep=${re}`, ...(depth ? [`--max-count=${depth}`, '--first-parent'] : []), commit])).length;
}

// Build contexts for one task under outDir/build/<task>/{deps-<hash>,tree-abc,tree-d}. Returns
// what a build script needs and what was removed (paths only).
export function writeContexts(task, { gitDir, filteredDir = null, outDir, harness, nodeVersion = null, defaultNodeVersion = null, ghSnapshot = null, ghArms = 'all', jqBinary = null, graphifyVersion = null, depth = task.history_depth ?? 0, agentImage = 'pitwall/agent-claude-code:latest' }) {
  if (!filteredDir || !existsSync(join(filteredDir, 'filter-repo', 'commit-map'))) throw new Error('writeContexts: the filtered history mirror is required (experiments/exp48/build-history-mirror.sh)');
  const show = (p) => git(gitDir, ['show', `${task.prefix_commit}:${p}`]);
  const pkg = show('package.json'), lock = show('package-lock.json');
  let rc = Buffer.alloc(0); try { rc = show('.npmrc'); } catch { /* none */ }
  const lockHash = sha12(Buffer.concat([pkg, lock, rc]));
  let nv = nodeVersion;
  if (!nv) { try { nv = show('.nvmrc').toString('utf8').trim().replace(/^v/, ''); } catch { nv = null; } }
  // A commit from before the project pinned its node version: the caller's default (recorded).
  const nodeVersionSource = /^\d+\.\d+\.\d+$/.test(String(nv)) ? '.nvmrc' : 'default';
  if (nodeVersionSource === 'default') nv = defaultNodeVersion;
  if (!/^\d+\.\d+\.\d+$/.test(String(nv))) throw new Error(`no exact node version for ${task.id} (.nvmrc missing or not x.y.z): pass nodeVersion`);
  const date = git(gitDir, ['show', '-s', '--format=%cI', task.prefix_commit]).toString('utf8').trim();
  const all = lines(git(gitDir, ['ls-tree', '-r', '--name-only', task.prefix_commit]));
  const removed = removedPaths(all, harness);
  const root = join(outDir, 'build', task.id);
  const ctx = (name) => { const d = join(root, name); rmSync(d, { recursive: true, force: true }); mkdirSync(d, { recursive: true }); return d; };
  const node = join(outDir, 'build', `node-${nv}`);
  mkdirSync(node, { recursive: true });
  writeFileSync(join(node, 'Dockerfile'), nodeDockerfile(agentImage, nv));
  const deps = join(outDir, 'build', `deps-${lockHash}`);
  mkdirSync(deps, { recursive: true });
  writeFileSync(join(deps, 'Dockerfile'), depsDockerfile(nodeImage(nv)));
  writeFileSync(join(deps, 'package.json'), pkg);
  writeFileSync(join(deps, 'package-lock.json'), lock);
  // The project's npm settings apply to the install as they would in a checkout.
  let npmrc = ''; try { npmrc = show('.npmrc').toString('utf8'); } catch { /* none */ }
  writeFileSync(join(deps, '.npmrc'), npmrc);
  const want = (kind) => lines(git(gitDir, ['ls-tree', '-r', task.prefix_commit])).filter((l) => kind === 'd' || !removed.includes(l.split('\t')[1])).join('\n');
  const mapped = mappedCommit(filteredDir, gitDir, task.prefix_commit);
  const history = {}, tools = {};
  for (const kind of ['abc', 'd']) {
    const d = ctx(`tree-${kind}`);
    // gh: the same stand-in and snapshot in the arms named by ghArms ('all' | 'd' | 'none').
    // graphify: only where the tree has graphify-out/ (arm D, at commits that track it).
    const gh = !!ghSnapshot && (ghArms === 'all' || (ghArms === 'd' && kind === 'd'));
    const graphify = kind === 'd' && graphifyVersion && all.some((p) => p.startsWith('graphify-out/')) ? graphifyVersion : null;
    tools[kind] = { gh, jq: gh && !!jqBinary, graphify };
    writeFileSync(join(d, 'Dockerfile'), treeDockerfile(depsImage(lockHash), date, { gh, jq: gh && !!jqBinary, graphifyVersion: graphify }));
    if (gh) {
      mkdirSync(join(d, 'pitwall-gh'));
      writeFileSync(join(d, 'pitwall-gh', 'gh.mjs'), shim('gh.mjs'));
      writeFileSync(join(d, 'pitwall-gh', 'snapshot.json'), JSON.stringify(ghSnapshot));
      if (jqBinary) cpSync(jqBinary, join(d, 'pitwall-gh', 'jq'));
    }
    mkdirSync(join(d, 'pitwall-rec'));
    for (const n of ['node-wrapper.sh', 'recorder.mjs', 'vitest-reporter.mjs']) writeFileSync(join(d, 'pitwall-rec', n), shim(n));
    const source = kind === 'd' ? gitDir : filteredDir;
    const commit = kind === 'd' ? task.prefix_commit : mapped.commit;
    const h = writeHistory(d, { source, commit, depth });
    // The checked-out tree must be the pre-fix tree (minus the removed paths for A/B/C), file for file.
    if (h.treeLines.trim() !== want(kind)) throw new Error(`history: the tree of ${kind} is not the pre-fix tree${kind === 'abc' ? ' without the harness files' : ''} for ${task.id}`);
    history[kind] = { commit, commits: h.commits, depth: h.depth, tarMiB: Math.round(h.tarBytes / (1 << 20)), mentions: historyMentions(source, commit, [task.issue, task.pr], depth), ...(kind === 'abc' ? { prunedPrefix: mapped.pruned } : {}) };
  }
  const info = { id: task.id, nodeVersion: nv, nodeVersionSource, lockHash, date, treePaths: all.length, removed, history, tools, ghSnapshotMeta: ghSnapshot?.meta ?? null, images: { node: nodeImage(nv), deps: depsImage(lockHash), abc: treeImage(task, 'A'), d: treeImage(task, 'D') }, contexts: { node, deps, abc: join(root, 'tree-abc'), d: join(root, 'tree-d') } };
  writeFileSync(join(root, 'materialised.json'), JSON.stringify(info, null, 1));
  return info;
}

function taskToml(task) {
  const l = task.limits;
  return `schema_version = "1.4"
artifacts = []

[task]
name = "pitwall/${task.id}"
version = "1.0.0"
description = ""
authors = []
keywords = []

[metadata]

[verifier]
timeout_sec = ${l.verifier_sec.toFixed(1)}
environment_mode = "shared"
collect = []

[verifier.env]

[agent]
timeout_sec = ${l.agent_sec.toFixed(1)}

[environment]
network_mode = "public"
build_timeout_sec = ${l.build_sec.toFixed(1)}
os = "linux"
mcp_servers = []

[environment.env]

[solution.env]
`;
}

// The verifier: capture the end state first, then run the hidden checks. Both use the real
// node, so what they run is not recorded as the agent's.
const VERIFIER = `#!/bin/bash
set -u
mkdir -p /logs/verifier
N=\${PITWALL_REAL_NODE:-/opt/pitwall/node/bin/node}
"$N" /tests/state-capture.mjs /app /logs/verifier/state.json > /logs/verifier/capture.log 2>&1 || echo "capture failed: $?" >> /logs/verifier/capture.log
if [ -f /tests/hidden.json ]; then "$N" /tests/hidden-run.mjs /app /tests /logs/verifier > /logs/verifier/hidden.log 2>&1 || echo "hidden failed: $?" >> /logs/verifier/hidden.log; fi
echo 1 > /logs/verifier/reward.txt
`;

// The verifier's directory (Harbor uploads tests/ only after the agent has ended): the hidden
// check files, the reference fix (for Q4) and the two verifier programs.
export function writeTests(dir, task, { gitDir }) {
  mkdirSync(join(dir, 'hidden'), { recursive: true });
  for (const p of task.hidden_checks) {
    const f = join(dir, 'hidden', p);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, git(gitDir, ['show', `${task.reference_commit}:${p}`]));
  }
  // The reference fix without its tests: what "the reference implementation" means for Q4.
  const impl = lines(git(gitDir, ['diff', '--name-only', '--no-renames', task.prefix_commit, task.reference_commit])).filter((p) => !TEST_FILE.test(p));
  writeFileSync(join(dir, 'reference-impl.patch'), impl.length ? git(gitDir, ['diff', '--binary', task.prefix_commit, task.reference_commit, '--', ...impl]) : '');
  writeFileSync(join(dir, 'hidden.json'), JSON.stringify({ id: task.id, hidden: task.hidden_checks, siblings: task.sibling_tests, implFiles: task.impl_files, sourcePaths: task.source_paths, hiddenSec: task.limits.hidden_sec, q4Sec: task.limits.q4_sec }, null, 1));
  // For the leak check in the image: the fix commit id, and hashes of the lines the fix adds that
  // no file of the pre-fix tree has (30+ non-blank characters). Hashes only.
  const base = hashesOfTrees(gitDir, [task.prefix_commit]);
  const added = git(gitDir, ['diff', '-U0', '--no-renames', task.prefix_commit, task.reference_commit]).toString('utf8').split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1));
  writeFileSync(join(dir, 'fix-absent.json'), JSON.stringify({ fixCommit: task.reference_commit, lineKeys: [...keysOf(added.join('\n'))].filter((k) => !base.has(k)) }));
  writeFileSync(join(dir, 'state-capture.mjs'), shim('state-capture.mjs'));
  writeFileSync(join(dir, 'hidden-run.mjs'), shim('hidden-run.mjs'));
  writeFileSync(join(dir, 'recorder.mjs'), shim('recorder.mjs'));
  writeFileSync(join(dir, 'test.sh'), VERIFIER, { mode: 0o755 });
}

// Scripted controls (Harbor's oracle agent; no model): the reference fix must pass the hidden
// checks, doing nothing must fail them.
export function controlScripts(task, { gitDir }) {
  const patch = git(gitDir, ['diff', '--binary', task.prefix_commit, task.reference_commit]).toString('base64');
  return {
    reference: `echo '${patch}' | base64 -d > /tmp/pitwall-reference.patch\ngit apply --whitespace=nowarn /tmp/pitwall-reference.patch\nrm -f /tmp/pitwall-reference.patch`,
    noop: 'true',
  };
}

// One Harbor arm directory: <armDir>/harbor-tasks/<task>/ (+ skills/ for C), in the layout
// runners/harbor.mjs run() reads. instruction: the request text (issue title and body plus the
// environment facts), supplied by the task author from a local file. requirementsDoc: arm B's
// document (a local path; written by another role). skills: arm C's skill directory.
export function compileArm(armDir, task, arm, { gitDir, instruction, requirementsDoc = null, skills = null, entry = null, script = null, agentImage = { ref: 'pitwall/agent-claude-code:latest', id: null } }) {
  if (!ARMS.includes(arm)) throw new Error(`unknown arm ${arm}`);
  if (arm === 'B' && !script && !requirementsDoc) throw new Error('arm B needs the requirements document (a path; this module does not write it)');
  if (arm === 'C' && !script && !skills) throw new Error('arm C needs the skill directory');
  const dir = join(armDir, 'harbor-tasks', task.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, 'environment'), { recursive: true });
  writeFileSync(join(dir, 'task.toml'), taskToml(task));
  const useEntry = arm === 'C' && !script ? entry : null;
  writeFileSync(join(dir, 'instruction.md'), `${useEntry ? `${useEntry} ` : ''}${instruction}\n`);
  let df = `FROM ${treeImage(task, arm)}\n`;
  if (arm === 'B' && !script) {
    cpSync(requirementsDoc, join(dir, 'environment', 'CLAUDE.md'));
    df += "COPY CLAUDE.md /app/CLAUDE.md\nRUN echo 'CLAUDE.md' >> /app/.git/info/exclude\n";
  }
  writeFileSync(join(dir, 'environment', 'Dockerfile'), `${df}WORKDIR /app\n`);
  writeTests(join(dir, 'tests'), task, { gitDir });
  if (script) {
    const scripts = controlScripts(task, { gitDir });
    if (!scripts[script]) throw new Error(`unknown control script ${script}`);
    mkdirSync(join(dir, 'solution'), { recursive: true });
    writeFileSync(join(dir, 'solution', 'solve.sh'), `#!/bin/bash\nset -u\ncd /app\n${scripts[script]}\n`, { mode: 0o755 });
  }
  rmSync(join(armDir, 'skills'), { recursive: true, force: true });
  if (arm === 'C' && !script) cpSync(skills, join(armDir, 'skills'), { recursive: true });
  writeFileSync(join(armDir, 'harbor-tasks', '.append-system-prompt'), '');
  writeFileSync(join(armDir, 'harbor-tasks', '.agent-image'), JSON.stringify(agentImage));
  writeFileSync(join(armDir, 'harbor-tasks', '.script'), script ?? '');
  // What differs between arms, for the record (plan §4 "必ず記録するもの").
  const facts = { task: task.id, arm, tree: treeKind(arm), entry: useEntry, requirementsDocChars: arm === 'B' && requirementsDoc && !script ? readFileSync(requirementsDoc, 'utf8').length : 0, skills: arm === 'C' && !script, script, instructionChars: instruction.length + (useEntry ? useEntry.length + 1 : 0) };
  writeFileSync(join(dir, 'arm.json'), JSON.stringify(facts, null, 1));
  return { dir, ...facts };
}
