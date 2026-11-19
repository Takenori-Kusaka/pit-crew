// Hidden checks for a real repository (plan 34 §9 instrument 6). Runs in the verifier, after
// the end state has been captured, with the real node (so nothing here is recorded as a run of
// the agent's):  node hidden-run.mjs <app dir> <tests dir> <out dir>
//
// <tests dir> is uploaded only after the agent has ended (Harbor), so the agent never had:
//   hidden.json           { hidden: [paths], siblings: [paths], hiddenSec, q4Sec }
//   hidden/<path>         the check files (the fix PR's tests), by their path in the repository
//   reference-impl.patch  the reference fix without its tests (for Q4)
//
// Steps, each timed, each with its own time limit (SIGKILL on expiry, recorded as timedOut):
//   Q1/Q2  the hidden files are copied over the final tree and run together with the sibling
//          tests of the same directories. A file the agent created or changed at the same path
//          is a COLLISION: the agent's version is kept aside and reported, and the hidden one
//          runs. (The agent's own version is what Q4 runs.)
//   Q4     the agent's own new or changed test files, run (a) on the pre-fix implementation —
//          they should fail — and (b) on the reference implementation — they should pass.
// Output: <out dir>/hidden.json. The tree is left as Q4 left it; the state was captured before.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_FILE = /(^|\/)[^/]+\.(test|spec)\.[cm]?[jt]sx?$/;
const git = (cwd, args) => spawnSync('git', ['-c', 'safe.directory=*', '-c', 'core.quotepath=false', ...args], { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });

// vitest's JSON report -> { files: [{ file, status, tests: [{ name, status }] }] }
export function readReport(file, app) {
  try {
    const j = JSON.parse(readFileSync(file, 'utf8'));
    const pre = `${String(app).replace(/\\/g, '/').replace(/\/$/, '')}/`;
    const rel = (p) => { const s = String(p).replace(/\\/g, '/'); return s.startsWith(pre) ? s.slice(pre.length) : s; };
    return (j.testResults ?? []).map((f) => ({ file: rel(f.name), status: f.status, tests: (f.assertionResults ?? []).map((t) => ({ name: t.fullName ?? t.title, status: t.status })) }));
  } catch { return null; }
}

// Run the test runner on the given files. `runner(files, reportFile)` -> argv (default: vitest).
export function runTests(app, files, { sec, report, node = process.execPath, runner = null }) {
  rmSync(report, { force: true });
  if (!files.length) return { ran: false, exit: null, timedOut: false, ms: 0, files: [] };
  const argv = runner ? runner(files, report) : [node, join(app, 'node_modules/vitest/vitest.mjs'), 'run', ...files, '--reporter=json', `--outputFile=${report}`];
  const t0 = Date.now();
  const r = spawnSync(argv[0], argv.slice(1), { cwd: app, encoding: 'utf8', timeout: sec * 1000, killSignal: 'SIGKILL', maxBuffer: 1 << 28, env: { ...process.env, CI: '1' } });
  const timedOut = r.error?.code === 'ETIMEDOUT' || r.signal === 'SIGKILL';
  return { ran: true, exit: r.status, timedOut, ms: Date.now() - t0, files: readReport(report, app), stderrTail: String(r.stderr ?? '').slice(-400) };
}

const passedAll = (res, wanted) => !!res.files && wanted.every((w) => res.files.some((f) => f.file === w && f.status === 'passed' && f.tests.length > 0 && f.tests.every((t) => t.status === 'passed')));
const anyFailed = (res, wanted) => !!res.files && wanted.some((w) => res.files.some((f) => f.file === w && (f.status === 'failed' || f.tests.some((t) => t.status === 'failed'))));
const counts = (res, wanted) => { const ts = (res.files ?? []).filter((f) => wanted.includes(f.file)).flatMap((f) => f.tests); return { tests: ts.length, passed: ts.filter((t) => t.status === 'passed').length, failed: ts.filter((t) => t.status === 'failed').length, filesReported: (res.files ?? []).filter((f) => wanted.includes(f.file)).length, filesWanted: wanted.length }; };

export function hiddenRun(app, tests, out, opts = {}) {
  const cfg = JSON.parse(readFileSync(join(tests, 'hidden.json'), 'utf8'));
  mkdirSync(out, { recursive: true });
  const t0 = Date.now();
  const base = (existsSync('/etc/pitwall/fixture-head') ? readFileSync('/etc/pitwall/fixture-head', 'utf8').trim() : '') || 'HEAD';
  const inBase = (p) => git(app, ['cat-file', '-e', `${base}:${p}`]).status === 0;
  // The agent's own test files, before anything is overwritten: changed or new relative to the fixture.
  const status = git(app, ['status', '--porcelain', '-z', '--untracked-files=all']).stdout.split('\0').filter(Boolean).map((l) => ({ code: l.slice(0, 2), path: l.slice(3) }));
  const own = status.filter((s) => TEST_FILE.test(s.path) && !s.code.includes('D') && existsSync(join(app, s.path))).map((s) => s.path);
  const aside = join(out, 'agent-tests');
  for (const p of own) { mkdirSync(dirname(join(aside, p)), { recursive: true }); cpSync(join(app, p), join(aside, p)); }
  // Q1 / Q2
  const collisions = [];
  for (const p of cfg.hidden) {
    const dst = join(app, p), src = join(tests, 'hidden', p);
    if (existsSync(dst)) {
      const same = readFileSync(dst).equals(readFileSync(src));
      const changedByAgent = status.some((s) => s.path === p);
      if (!same && changedByAgent) collisions.push({ path: p, kind: inBase(p) ? 'agent-changed-existing' : 'agent-created' });
    }
    mkdirSync(dirname(dst), { recursive: true });
    cpSync(src, dst);
  }
  const siblings = cfg.siblings.filter((p) => existsSync(join(app, p)));
  const main = runTests(app, [...cfg.hidden, ...siblings], { sec: cfg.hiddenSec, report: join(out, 'hidden-vitest.json'), ...opts });
  const result = {
    id: cfg.id, collisions, ownTests: own,
    hidden: { ...counts(main, cfg.hidden), allPassed: passedAll(main, cfg.hidden), anyFailed: anyFailed(main, cfg.hidden) },
    siblings: { ...counts(main, siblings), allPassed: siblings.length ? passedAll(main, siblings) : null, missing: cfg.siblings.length - siblings.length },
    run: { exit: main.exit, timedOut: main.timedOut, ms: main.ms, reported: !!main.files, stderrTail: main.files ? undefined : main.stderrTail },
    detail: main.files,
    q4: null,
  };
  // Q4: the agent's tests on the pre-fix and on the reference implementation.
  const patch = join(tests, 'reference-impl.patch');
  if (own.length && existsSync(patch) && statSync(patch).size > 0 && cfg.q4Sec > 0) {
    const put = () => { for (const p of own) { mkdirSync(dirname(join(app, p)), { recursive: true }); cpSync(join(aside, p), join(app, p)); } };
    git(app, ['reset', '-q', '--hard', base]);
    git(app, ['clean', '-q', '-fd']); // untracked files go; ignored ones (node_modules) stay
    put();
    const pre = runTests(app, own, { sec: cfg.q4Sec, report: join(out, 'q4-prefix-vitest.json'), ...opts });
    const ap = git(app, ['apply', '--whitespace=nowarn', patch]);
    const ref = ap.status === 0 ? runTests(app, own, { sec: cfg.q4Sec, report: join(out, 'q4-reference-vitest.json'), ...opts }) : { ran: false, files: null, exit: null, timedOut: false, ms: 0 };
    result.q4 = {
      files: own.length, applied: ap.status === 0,
      failsOnPrefix: anyFailed(pre, own), passesOnReference: ap.status === 0 ? passedAll(ref, own) : null,
      prefix: { exit: pre.exit, timedOut: pre.timedOut, ms: pre.ms, ...counts(pre, own) },
      reference: { exit: ref.exit, timedOut: ref.timedOut, ms: ref.ms, ...counts(ref, own) },
    };
  }
  result.totalMs = Date.now() - t0;
  writeFileSync(join(out, 'hidden.json'), JSON.stringify(result));
  return result;
}

let self = false;
try { self = !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { /* imported */ }
if (self) {
  const [app = '/app', tests = '/tests', out = '/logs/verifier'] = process.argv.slice(2);
  const r = hiddenRun(app, tests, out);
  process.stdout.write(`hidden ${r.hidden.passed}/${r.hidden.tests} passed (all=${r.hidden.allPassed}), siblings ${r.siblings.passed}/${r.siblings.tests}, collisions ${r.collisions.length}, ${r.run.ms} ms${r.run.timedOut ? ' TIMED OUT' : ''}, total ${r.totalMs} ms\n`);
}
