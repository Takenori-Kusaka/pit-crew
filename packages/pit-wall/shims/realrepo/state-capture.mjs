// End-state capture for a real repository (plan 34 §9 instrument 4). Runs in the verifier with
// the real node:  node state-capture.mjs <app dir> <out.json>
//
// The first capture (runners/state-capture.sh) walks every file except .git, which in a real
// project means node_modules (hundreds of MB). This one asks git: the tree is the tracked files
// plus the untracked files that are not ignored, taken in a private index, so node_modules,
// build output and anything else the project ignores is never read.
//
// Output (readable by runners/harbor.mjs readState; `real` carries what is new):
//   files    ONLY the files that differ from the fixture commit or are new:
//            { path: { sha256, b64 } }  (b64 "" when over the per-file or the total limit)
//   real     { scope: "changed", tree: { path: blob id } for EVERY file of the final tree,
//              deleted: [paths], finalSrcTree, records: [run records], limits, truncated: {...},
//              ignoredSample: n }   — the unchanged files' text is the fixture commit's
//   git      { head, fixtureHead, fixtureIntact, log_b64 }
//   finalTree, oomKills
// Limits: 256 KiB per file, 8 MiB of content in total, 2,000 changed files, 4 MiB of run records.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LIMITS = { fileBytes: 256 << 10, totalBytes: 8 << 20, changedFiles: 2000, recordBytes: 4 << 20 };

const git = (cwd, args, env = {}) => {
  const r = spawnSync('git', ['-c', 'safe.directory=*', '-c', 'core.quotepath=false', ...args], { cwd, env: { ...process.env, ...env }, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] });
  if (r.status !== 0) throw new Error(`git ${args[0]} failed`);
  return r.stdout;
};
const lsTree = (cwd, tree, env = {}) => Object.fromEntries(git(cwd, ['ls-tree', '-r', '-z', tree], env).split('\0').filter(Boolean).map((l) => { const [meta, path] = l.split('\t'); return [path, meta.split(' ')[2]]; }));

export function capture(app, { limits = LIMITS, recDir = process.env.PITWALL_REC_DIR ?? '/var/pitwall/rec', fixtureHeadFile = '/etc/pitwall/fixture-head', ghDir = process.env.PITWALL_GH_LOG_DIR ?? '/var/pitwall/gh', srcPaths = (process.env.PITWALL_SRC_PATHS ?? 'src tests').split(/\s+/).filter(Boolean), readRecords = null } = {}) {
  const top = git(app, ['rev-parse', '--show-toplevel']).trim();
  const head = git(top, ['rev-parse', 'HEAD']).trim();
  const fixtureHead = existsSync(fixtureHeadFile) ? readFileSync(fixtureHeadFile, 'utf8').trim() : '';
  const base = fixtureHead || head;
  const tmp = mkdtempSync(join(tmpdir(), 'pw-cap-'));
  let finalTree, final, finalSrcTree;
  try {
    const idx = resolve(top, git(top, ['rev-parse', '--git-path', 'index']).trim());
    const objs = resolve(top, git(top, ['rev-parse', '--git-path', 'objects']).trim());
    mkdirSync(join(tmp, 'objects'));
    if (existsSync(idx)) copyFileSync(idx, join(tmp, 'index'));
    const env = { GIT_INDEX_FILE: join(tmp, 'index'), GIT_OBJECT_DIRECTORY: join(tmp, 'objects'), GIT_ALTERNATE_OBJECT_DIRECTORIES: objs };
    git(top, ['add', '-A'], env);
    finalTree = git(top, ['write-tree'], env).trim();
    final = lsTree(top, finalTree, env);
    finalSrcTree = createHash('sha256').update(srcPaths.length ? git(top, ['ls-tree', finalTree, '--', ...srcPaths], env).trim() : '').digest('hex').slice(0, 40);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  const start = lsTree(top, base);
  const changed = Object.keys(final).filter((p) => start[p] !== final[p]).sort();
  const deleted = Object.keys(start).filter((p) => !(p in final)).sort();
  const files = {};
  const truncated = { overFile: 0, overTotal: 0, overCount: Math.max(0, changed.length - limits.changedFiles) };
  let total = 0;
  for (const p of changed.slice(0, limits.changedFiles)) {
    const f = join(top, p);
    let buf;
    try { if (!statSync(f).isFile()) continue; buf = readFileSync(f); } catch { continue; }
    const sha256 = createHash('sha256').update(buf).digest('hex');
    let b64 = '';
    if (buf.length > limits.fileBytes) truncated.overFile++;
    else if (total + buf.length > limits.totalBytes) truncated.overTotal++;
    else { b64 = buf.toString('base64'); total += buf.length; }
    files[p] = { sha256, b64 };
  }
  let intact = false;
  try { git(top, ['merge-base', '--is-ancestor', base, 'HEAD']); intact = !!fixtureHead; } catch { intact = false; }
  let log = '';
  try { log = git(top, ['log', '--all', '--format=%H %cI %s']); } catch { /* no commits */ }
  // Run records (recorder.mjs), dropping per-test detail from the oldest once over the limit.
  let records = [];
  try { records = (readRecords ?? (() => []))(recDir); } catch { records = []; }
  let size = JSON.stringify(records).length, dropped = 0;
  for (let i = 0; size > limits.recordBytes && i < records.length; i++) {
    if (records[i].tests?.files) { records[i] = { ...records[i], tests: { summary: records[i].tests.summary, files: null, dropped: true } }; dropped++; size = JSON.stringify(records).length; }
  }
  // Calls to the gh stand-in (gh.mjs): what was asked and whether the snapshot could answer.
  let gh = null;
  try {
    const rows = readFileSync(join(ghDir, 'calls.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const byAnswer = {};
    for (const r of rows) byAnswer[r.answered] = (byAnswer[r.answered] ?? 0) + 1;
    gh = { calls: rows.length, byAnswer, rows: rows.slice(0, 500) };
  } catch { gh = existsSync(ghDir) ? { calls: 0, byAnswer: {}, rows: [] } : null; }
  let oom = -1;
  try { const m = readFileSync('/sys/fs/cgroup/memory.events', 'utf8').match(/^oom_kill (\d+)/m); if (m) oom = Number(m[1]); } catch { /* unknown */ }
  return {
    files,
    git: { head, fixtureHead, fixtureIntact: intact, log_b64: Buffer.from(log).toString('base64') },
    commands: {},
    finalTree,
    checks_b64: '',
    oomKills: oom,
    real: { scope: 'changed', tree: final, deleted, finalSrcTree, records, gh, limits, truncated: { ...truncated, recordDetailDropped: dropped }, contentBytes: total, treeFiles: Object.keys(final).length },
  };
}

let self = false;
try { self = !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { /* imported */ }
if (self) {
  const [app = '/app', out = '/logs/verifier/state.json'] = process.argv.slice(2);
  const { readRecords } = await import(new URL('./recorder.mjs', import.meta.url));
  const t0 = Date.now();
  const state = capture(app, { readRecords });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(state));
  process.stdout.write(`captured ${Object.keys(state.files).length} changed of ${state.real.treeFiles} files, ${state.real.deleted.length} deleted, ${state.real.records.length} run records, ${statSync(out).size} bytes, ${Date.now() - t0} ms\n`);
}
