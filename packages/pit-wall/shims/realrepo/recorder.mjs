// pitwall recorder: runs one node program exactly as it was asked to run, and leaves a record of
// the run when the program is one of the project's check tools (vitest, svelte-check, tsc, biome,
// eslint, stylelint, svelte-kit, playwright) or an npm / npx script run.
//
// It is reached through the `node` wrapper (node-wrapper.sh, installed as the only `node` on
// PATH), so the form of the call does not matter: `npx vitest run x`, `npm test`,
// `npm run check`, `node_modules/.bin/vitest`, `node node_modules/vitest/vitest.mjs`,
// `a && b`, `bash -c '...'`, `cd sub && ...`, `timeout 5 ...` all end in `node <script> ...`.
//
// What the agent sees is unchanged: the child inherits stdin / stdout / stderr, the exit code
// is the child's, and a child killed by a signal ends this process by the same signal. Nothing
// is printed here, and a failure to record is swallowed.
//
// Records (one run = one id), in $PITWALL_REC_DIR (default /var/pitwall/rec):
//   <id>.start.json  { id, tool, argv, cwd, ts, tree, srcTree, parent, npm }   written BEFORE the run
//   <id>.end.json    { id, exit, signal, ts, durationMs, tree, srcTree, tests } written after it
//   <id>.vitest.json per-test results written by the silent reporter (vitest-reporter.mjs), when the tool is vitest
// A start without an end is a run that was killed hard (SIGKILL) or outlived the trial.
// tree: git tree id of the whole working tree (tracked + untracked, ignore rules respected).
// srcTree: hash of the tree entries of $PITWALL_SRC_PATHS (default "src tests") only, so that
// writing a report file after the last check does not make the check "not on the final tree".
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// node options that take their value as the next argument.
const VALUE_OPTS = new Set(['-r', '--require', '--import', '--loader', '--experimental-loader', '-C', '--conditions', '--env-file', '--env-file-if-exists', '--input-type', '--title', '--inspect-port', '--watch-path', '--disable-warning']);
const NO_SCRIPT = new Set(['-e', '--eval', '-p', '--print', '-c', '--check', '-i', '--interactive', '-v', '--version', '-h', '--help', '--run', '--test']);

// Index of the script in node's arguments, or -1 (eval, REPL, --version...).
export function scriptIndex(args) {
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') return i + 1 < args.length ? i + 1 : -1;
    if (NO_SCRIPT.has(a)) return -1;
    if (VALUE_OPTS.has(a)) { i++; continue; }
    if (a.startsWith('-')) continue;
    return i;
  }
  return -1;
}

const TOOLS = [
  [/[\\/]node_modules[\\/]vitest[\\/]/, 'vitest'],
  [/[\\/]node_modules[\\/]svelte-check[\\/]/, 'svelte-check'],
  [/[\\/]node_modules[\\/]typescript[\\/]bin[\\/]tsc$/, 'tsc'],
  [/[\\/]node_modules[\\/]@biomejs[\\/]biome[\\/]/, 'biome'],
  [/[\\/]node_modules[\\/]eslint[\\/]/, 'eslint'],
  [/[\\/]node_modules[\\/]stylelint[\\/]/, 'stylelint'],
  [/[\\/]node_modules[\\/]@sveltejs[\\/]kit[\\/]/, 'svelte-kit'],
  [/[\\/]node_modules[\\/](@playwright[\\/]test|playwright)[\\/]/, 'playwright'],
  [/[\\/]node_modules[\\/]npm[\\/]bin[\\/]npx-cli\.js$/, 'npx'],
  [/[\\/]node_modules[\\/]npm[\\/]bin[\\/]npm-cli\.js$/, 'npm'],
];
const NPM_RUNS = new Set(['test', 't', 'tst', 'run', 'run-script', 'rum', 'urn', 'exec', 'x', 'start', 'stop', 'restart']);

// Which tool a node invocation is: { tool, scriptAt, npm } or null (not recorded).
export function identify(args, cwd = process.cwd()) {
  const at = scriptIndex(args);
  if (at === -1) return null;
  let p = resolve(cwd, args[at]);
  try { p = realpathSync(p); } catch { /* not a file: node will say so */ }
  const hit = TOOLS.find(([re]) => re.test(p));
  if (!hit) return null;
  const tool = hit[1];
  if (tool !== 'npm' && tool !== 'npx') return { tool, scriptAt: at, npm: null };
  const rest = args.slice(at + 1);
  if (tool === 'npx') return { tool, scriptAt: at, npm: { sub: 'npx', script: rest.find((a) => !a.startsWith('-')) ?? null } };
  const k = rest.findIndex((a) => !a.startsWith('-'));
  const sub = k === -1 ? null : rest[k];
  if (!NPM_RUNS.has(sub)) return null; // npm install, npm ls ...: not a check run
  const script = ['run', 'run-script', 'rum', 'urn', 'exec', 'x'].includes(sub) ? rest.slice(k + 1).find((a) => !a.startsWith('-')) ?? null : sub === 't' || sub === 'tst' ? 'test' : sub;
  return { tool, scriptAt: at, npm: { sub, script } };
}

const VITEST_NO_RUN = new Set(['list', 'init', 'bench']);
// The silent reporter that writes per-test results (vitest-reporter.mjs, next to this file).
export const VITEST_REPORTER = fileURLToPath(new URL('./vitest-reporter.mjs', import.meta.url));
// Arguments to add so that vitest also runs the silent reporter, leaving what it prints as it
// would be without them. CLI reporters replace the configured ones, so when the caller named
// none, the ones that would have run are named again ($PITWALL_VITEST_DEFAULT_REPORTERS,
// default "default": set it per image when the project's config names other reporters).
export function vitestExtra(toolArgs, reporter = VITEST_REPORTER, defaults = (process.env.PITWALL_VITEST_DEFAULT_REPORTERS ?? 'default').split(',').filter(Boolean)) {
  if (toolArgs.some((a) => ['-h', '--help', '-v', '--version'].includes(a))) return [];
  const first = toolArgs.find((a) => !a.startsWith('-'));
  if (VITEST_NO_RUN.has(first)) return [];
  const named = toolArgs.some((a) => a === '--reporter' || a.startsWith('--reporter='));
  return [...(named ? [] : defaults.map((r) => `--reporter=${r}`)), `--reporter=${reporter}`];
}

const git = (cwd, args, env = {}) => {
  const r = spawnSync('git', ['-c', 'safe.directory=*', ...args], { cwd, env: { ...process.env, ...env }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  if (r.status !== 0) throw new Error('git');
  return r.stdout.trim();
};

// { tree, srcTree } of the working tree containing cwd; nulls when it cannot be computed.
// Same content as shims/mark-run.sh's pw_tree: a copy of the index and a private object
// directory, so neither the real index nor the object store is touched.
export function treeHash(cwd, srcPaths = (process.env.PITWALL_SRC_PATHS ?? 'src tests').split(/\s+/).filter(Boolean)) {
  let tmp = null;
  try {
    const top = git(cwd, ['rev-parse', '--show-toplevel']);
    const idx = resolve(top, git(top, ['rev-parse', '--git-path', 'index']));
    const objs = resolve(top, git(top, ['rev-parse', '--git-path', 'objects']));
    tmp = mkdtempSync(join(tmpdir(), 'pw-tree-'));
    mkdirSync(join(tmp, 'objects'));
    if (existsSync(idx)) copyFileSync(idx, join(tmp, 'index'));
    const env = { GIT_INDEX_FILE: join(tmp, 'index'), GIT_OBJECT_DIRECTORY: join(tmp, 'objects'), GIT_ALTERNATE_OBJECT_DIRECTORIES: objs };
    git(top, ['add', '-A'], env);
    const tree = git(top, ['write-tree'], env);
    const entries = srcPaths.length ? git(top, ['ls-tree', tree, '--', ...srcPaths], env) : '';
    return { tree, srcTree: createHash('sha256').update(entries).digest('hex').slice(0, 40) };
  } catch { return { tree: null, srcTree: null }; } finally { if (tmp) rmSync(tmp, { recursive: true, force: true }); }
}

// Per-test results from vitest's JSON report: [{ file, status, tests: [{ name, status }] }].
export function vitestTests(file, top = null) {
  try {
    const j = JSON.parse(readFileSync(file, 'utf8'));
    const rel = (p) => { const s = String(p).replace(/\\/g, '/'); const t = top ? `${String(top).replace(/\\/g, '/').replace(/\/$/, '')}/` : null; return t && s.startsWith(t) ? s.slice(t.length) : s; };
    return {
      summary: { files: j.numTotalTestSuites ?? null, tests: j.numTotalTests ?? null, passed: j.numPassedTests ?? null, failed: j.numFailedTests ?? null, success: j.success ?? null },
      files: (j.testResults ?? []).map((f) => ({ file: rel(f.name), status: f.status, tests: (f.assertionResults ?? []).map((t) => ({ name: t.fullName ?? t.title, status: t.status })) })),
    };
  } catch { return null; }
}

function writeJson(file, doc) { try { writeFileSync(file, JSON.stringify(doc)); } catch { /* recording never breaks the run */ } }

export function main(args, { realNode = process.execPath } = {}) {
  const cwd = process.cwd();
  const what = identify(args, cwd);
  let rec = null;
  let childArgs = args;
  if (what) {
    try {
      const dir = process.env.PITWALL_REC_DIR ?? '/var/pitwall/rec';
      mkdirSync(dir, { recursive: true });
      const id = `${new Date().toISOString().replace(/[-:.]/g, '')}-${process.pid}`;
      rec = { id, dir, start: Date.now(), vitest: null };
      if (what.tool === 'vitest') {
        const f = join(dir, `${id}.vitest.json`);
        const extra = existsSync(VITEST_REPORTER) ? vitestExtra(args.slice(what.scriptAt + 1)) : [];
        if (extra.length) { childArgs = [...args, ...extra]; rec.vitest = f; }
      }
      writeJson(join(dir, `${id}.start.json`), { id, tool: what.tool, argv: args, cwd, ts: new Date(rec.start).toISOString(), ...treeHash(cwd), parent: process.env.PITWALL_REC_PARENT ?? null, npm: what.npm, perTest: what.tool === 'vitest' ? (rec.vitest ? 'reporter' : 'unavailable') : null });
    } catch { rec = null; childArgs = args; }
  }
  const child = spawn(realNode, childArgs, { stdio: 'inherit', env: rec ? { ...process.env, PITWALL_REC_PARENT: rec.id, ...(rec.vitest ? { PITWALL_VITEST_OUT: rec.vitest } : {}) } : process.env });
  const forward = (sig) => { try { child.kill(sig); } catch { /* gone */ } };
  for (const s of ['SIGTERM', 'SIGINT', 'SIGHUP', 'SIGQUIT']) { try { process.on(s, () => forward(s)); } catch { /* not on this platform */ } }
  child.on('error', () => process.exit(127));
  child.on('exit', (code, signal) => {
    if (rec) {
      let top = null;
      try { top = git(cwd, ['rev-parse', '--show-toplevel']); } catch { /* not a repository */ }
      writeJson(join(rec.dir, `${rec.id}.end.json`), { id: rec.id, exit: code, signal, ts: new Date().toISOString(), durationMs: Date.now() - rec.start, ...treeHash(cwd), tests: rec.vitest ? vitestTests(rec.vitest, top) : null });
    }
    if (signal) { process.removeAllListeners(signal); try { process.kill(process.pid, signal); } catch { /* fall through */ } setTimeout(() => process.exit(1), 200); return; }
    process.exit(code ?? 1);
  });
}

// Read every record in a directory: [{ id, tool, argv, cwd, ts, tree, srcTree, exit, signal, ended, tests, ... }], oldest first.
export function readRecords(dir) {
  const out = new Map();
  let names = [];
  try { names = readdirSync(dir); } catch { return []; }
  for (const n of names.sort()) {
    const m = n.match(/^(.*)\.(start|end)\.json$/);
    if (!m) continue;
    let doc;
    try { doc = JSON.parse(readFileSync(join(dir, n), 'utf8')); } catch { continue; }
    const cur = out.get(m[1]) ?? { id: m[1], ended: false };
    if (m[2] === 'start') out.set(m[1], { ...cur, ...doc, startTree: doc.tree, startSrcTree: doc.srcTree, tree: cur.tree ?? doc.tree, srcTree: cur.srcTree ?? doc.srcTree });
    else out.set(m[1], { ...cur, exit: doc.exit, signal: doc.signal, endTs: doc.ts, durationMs: doc.durationMs, endTree: doc.tree, endSrcTree: doc.srcTree, tests: doc.tests, ended: true });
  }
  return [...out.values()].filter((r) => r.tool).sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
}

let self = false;
try { self = !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { /* imported */ }
if (self) main(process.argv.slice(2), { realNode: process.env.PITWALL_REAL_NODE || process.execPath });
