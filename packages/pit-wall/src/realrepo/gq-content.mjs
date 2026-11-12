// Guard for owner decision 3 (plan 34 §3): nothing with the subject repository's source, tests,
// diffs or issue text goes into a tracked path of this repository. Tracked files may hold
// pointers only (repository, commit ids, PR / issue numbers, path lists, hashes, scores).
//
// A line counts when it has 30 or more characters after all whitespace is removed (the same
// length the memorisation probe uses). The subject's lines are hashed from a local clone
// (never tracked); a file to be committed fails when one of its lines has such a hash, unless
//   - the same line was already in this repository at the base commit (it predates the
//     experiment: generic lines such as `import assert from 'node:assert/strict';`), or
//   - its hash is in the allow list (hashes only, with a reason) AND the entry names its reviewer
//     (`reviewed_by`); an entry without one is a proposal and does not count.
// Scope: by default the files that differ from the base commit plus untracked, non-ignored
// files, and in a modified file only the lines the base version did not have. --all scans every
// tracked file (before publish-snapshot).
//
//   node packages/pit-wall/src/gates.mjs no-gq-content [--all] [--base <commit>] [--subject <git dir>]
//        [--commits a,b] [--config experiments/exp48/no-gq-content.json] [--texts <dir>]
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';

export const MIN_CHARS = 30;
export const MAX_BLOB = 1 << 20; // larger blobs are generated data (graphs, lock files), not source lines

export function lineKey(line) {
  const s = String(line).replace(/\s+/g, '');
  return s.length >= MIN_CHARS ? createHash('sha256').update(s).digest('hex').slice(0, 20) : null;
}
export function keysOf(text) {
  const out = new Set();
  for (const l of String(text).split('\n')) { const k = lineKey(l); if (k) out.add(k); }
  return out;
}

const git = (dir, args, opts = {}) => {
  const r = spawnSync('git', ['-c', 'core.quotepath=false', ...args], { cwd: dir, maxBuffer: 1 << 30, ...opts });
  if (r.status !== 0) throw new Error(`git ${args.slice(0, 3).join(' ')} failed in ${dir}: ${String(r.stderr).slice(0, 300)}`);
  return r.stdout;
};

// Text blobs (<= MAX_BLOB, no NUL byte) of the given trees: Map<blob id, Buffer>.
export function readBlobs(gitDir, treeishes) {
  const ids = new Set();
  for (const t of treeishes) {
    for (const l of git(gitDir, ['ls-tree', '-r', '-l', t]).toString('utf8').split('\n')) {
      const m = l.match(/^\d+ blob ([0-9a-f]+)\s+(\d+)\t/);
      if (m && Number(m[2]) <= MAX_BLOB) ids.add(m[1]);
    }
  }
  const out = new Map();
  if (!ids.size) return out;
  const buf = git(gitDir, ['cat-file', '--batch'], { input: [...ids].join('\n') + '\n' });
  let p = 0;
  while (p < buf.length) {
    const nl = buf.indexOf(10, p);
    if (nl === -1) break;
    const [id, type, size] = buf.subarray(p, nl).toString('utf8').split(' ');
    if (type !== 'blob') { p = nl + 1; continue; }
    const body = buf.subarray(nl + 1, nl + 1 + Number(size));
    if (!body.includes(0)) out.set(id, body);
    p = nl + 1 + Number(size) + 1;
  }
  return out;
}

export function hashesOfTrees(gitDir, treeishes) {
  const keys = new Set();
  for (const body of readBlobs(gitDir, treeishes).values()) for (const k of keysOf(body.toString('utf8'))) keys.add(k);
  return keys;
}

// Every text file under a directory (issue texts and other subject material kept locally).
function textsUnder(dir) {
  if (!dir || !existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' || e.name.endsWith('.git') ? [] : textsUnder(p);
    return /\.(md|txt|json|patch|diff)$/i.test(e.name) && statSync(p).size <= MAX_BLOB ? [p] : [];
  });
}

// The subject's line hashes, cached next to the clone (the cache is local, never tracked).
export function subjectHashes({ subject, commits, texts = null, cache = null }) {
  const resolved = commits.map((c) => git(subject, ['rev-parse', '--verify', `${c}^{commit}`]).toString('utf8').trim());
  const textFiles = textsUnder(texts);
  const stamp = createHash('sha256').update(JSON.stringify([resolved, textFiles.map((f) => [f, statSync(f).mtimeMs, statSync(f).size]), MIN_CHARS, MAX_BLOB])).digest('hex');
  if (cache && existsSync(cache)) {
    const c = JSON.parse(readFileSync(cache, 'utf8'));
    if (c.stamp === stamp) return { keys: new Set(c.keys), commits: resolved, texts: textFiles.length };
  }
  const keys = hashesOfTrees(subject, resolved);
  for (const f of textFiles) for (const k of keysOf(readFileSync(f, 'utf8'))) keys.add(k);
  if (cache) { mkdirSync(dirname(cache), { recursive: true }); writeFileSync(cache, JSON.stringify({ stamp, keys: [...keys] })); }
  return { keys, commits: resolved, texts: textFiles.length };
}

// Lines of `text` whose hash is the subject's and is neither known before nor allowed.
export function findHits(text, subjectKeys, { known = new Set(), allow = new Set() } = {}) {
  const hits = [];
  String(text).split('\n').forEach((l, i) => {
    const k = lineKey(l);
    if (k && subjectKeys.has(k) && !known.has(k) && !allow.has(k)) hits.push({ line: i + 1, key: k });
  });
  return hits;
}

// Scan a repository. Returns { files, hits: [{ path, line, key }], scanned }.
export function scanRepo({ repo, subjectKeys, base, all = false, allow = new Set(), baselinePaths = ['packages', 'experiments', 'docs', 'suites', 'gates'] }) {
  const ls = (args) => git(repo, args).toString('utf8').split('\0').filter(Boolean);
  const untracked = ls(['ls-files', '-o', '--exclude-standard', '-z']);
  const changed = all ? ls(['ls-files', '-z']) : ls(['diff', '--name-only', '--diff-filter=ACMRT', '-z', base]);
  const files = [...new Set([...changed, ...untracked])];
  // Lines this repository's own (non-subject) directories already had at the base commit.
  const known = hashesOfTrees(repo, baselinePaths.filter((p) => spawnSync('git', ['cat-file', '-e', `${base}:${p}`], { cwd: repo }).status === 0).map((p) => `${base}:${p}`));
  const hits = [];
  let scanned = 0;
  for (const f of files) {
    const p = join(repo, f);
    if (!existsSync(p) || !statSync(p).isFile() || statSync(p).size > 8 * MAX_BLOB) continue;
    const body = readFileSync(p);
    if (body.includes(0)) continue;
    scanned++;
    // In a file that existed at the base, only the lines added since are this change's doing.
    let own = known;
    if (!untracked.includes(f)) {
      const prev = spawnSync('git', ['show', `${base}:${f}`], { cwd: repo, maxBuffer: 1 << 28 });
      if (prev.status === 0) own = new Set([...known, ...keysOf(prev.stdout.toString('utf8'))]);
    }
    for (const h of findHits(body.toString('utf8'), subjectKeys, { known: own, allow })) hits.push({ path: f, ...h });
  }
  return { files: files.length, scanned, hits };
}

const opt = (args, name) => { const i = args.indexOf(`--${name}`); return i === -1 ? null : args[i + 1]; };

export function cli(args) {
  const repo = resolve(opt(args, 'repo') ?? '.');
  const cfgFile = resolve(repo, opt(args, 'config') ?? 'experiments/exp48/no-gq-content.json');
  const cfg = existsSync(cfgFile) ? JSON.parse(readFileSync(cfgFile, 'utf8')) : {};
  const subject = resolve(repo, opt(args, 'subject') ?? cfg.subject ?? 'local/exp48-gq/gq.git');
  const base = opt(args, 'base') ?? cfg.base;
  if (!base) { process.stderr.write('no-gq-content: no base commit (--base or config.base)\n'); return 2; }
  // Fail closed: without the clone there is nothing to compare with, and "no hits" would be empty.
  if (!existsSync(subject)) { process.stdout.write(`no-gq-content: STOP — subject clone not found at ${subject}; cannot check\n`); return 1; }
  const commits = [...new Set([...(opt(args, 'commits') ?? '').split(','), ...(cfg.commits ?? []), ...pointerCommits(resolve(repo, cfg.pointers ?? 'experiments/exp48')), 'HEAD'].filter(Boolean))];
  const texts = resolve(repo, opt(args, 'texts') ?? cfg.texts ?? 'local/exp48-gq/tasks');
  const sub = subjectHashes({ subject, commits, texts, cache: join(dirname(subject), 'gq-line-hashes.json') });
  // Only entries a reviewer has signed count; a proposal by the one who wrote the file does not.
  const allow = new Set((cfg.allow ?? []).filter((a) => a.reviewed_by).map((a) => a.key));
  const proposed = new Set((cfg.allow ?? []).filter((a) => !a.reviewed_by).map((a) => a.key));
  const r = scanRepo({ repo, subjectKeys: sub.keys, base, all: args.includes('--all'), allow });
  process.stdout.write(`no-gq-content: ${sub.keys.size} subject line hashes (${sub.commits.length} commits, ${sub.texts} local texts); scanned ${r.scanned} of ${r.files} files against base ${base.slice(0, 9)}\n`);
  const byFile = new Map();
  for (const h of r.hits) byFile.set(h.path, [...(byFile.get(h.path) ?? []), h]);
  for (const [p, hs] of byFile) process.stdout.write(`  ${p}: ${hs.length} line(s) — ${hs.slice(0, 8).map((h) => `${h.line}:${h.key}`).join(' ')}${hs.length > 8 ? ' …' : ''}\n`);
  const waiting = r.hits.filter((h) => proposed.has(h.key)).length;
  if (waiting) process.stdout.write(`  ${waiting} of these lines have an allow entry that is proposed but not reviewed (reviewed_by is empty)\n`);
  process.stdout.write(r.hits.length ? `no-gq-content: STOP — ${r.hits.length} line(s) in ${byFile.size} file(s) match the subject repository\n` : 'no-gq-content: ok\n');
  return r.hits.length ? 1 : 0;
}

// Commit ids named by the pointer files (task specs, samples): 40 hex in any *.json below a directory.
export function pointerCommits(dir) {
  const out = new Set();
  const walk = (d) => { for (const e of existsSync(d) ? readdirSync(d, { withFileTypes: true }) : []) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.json')) for (const m of readFileSync(p, 'utf8').matchAll(/"(?:prefix_commit|reference_commit|pre_fix_commit|fix_commit)"\s*:\s*"([0-9a-f]{40})"/g)) out.add(m[1]); } };
  walk(dir);
  return [...out];
}
