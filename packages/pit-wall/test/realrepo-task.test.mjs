// Real-repository tasks (plan 34 §9 instruments 2, 4, 6): materialising a pointer into arms,
// the ignore-aware end-state capture, and the hidden checks with their controls.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileArm, controlScripts, deriveTask, emptiedDirs, loadTask, matches, removedPaths, validateTask, writeContexts } from '../src/realrepo/task.mjs';
import { capture } from '../shims/realrepo/state-capture.mjs';
import { hiddenRun } from '../shims/realrepo/hidden-run.mjs';
import { readRecords } from '../shims/realrepo/recorder.mjs';
import { readState } from '../src/runners/harbor.mjs';

const G = ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'core.autocrlf=false', '-c', 'commit.gpgsign=false'];
const git = (cwd, ...args) => { const r = spawnSync('git', [...G, ...args], { cwd, encoding: 'utf8' }); if (r.status !== 0) throw new Error(r.stderr); return r.stdout.trim(); };
const put = (root, files) => { for (const [p, t] of Object.entries(files)) { if (t === null) { rmSync(join(root, p), { force: true }); continue; } mkdirSync(join(root, p, '..'), { recursive: true }); writeFileSync(join(root, p), t); } };
const HARNESS = { remove: [{ pattern: '**/CLAUDE.md' }, { pattern: '.claude/' }, { pattern: 'docs/sessions/' }] };
const SECRET = 'HIDDEN-CHECK-BODY-7f3a';

// A small stand-in for the subject: a pre-fix commit and the fix (implementation + tests).
function subject() {
  const d = mkdtempSync(join(tmpdir(), 'pw-subj-'));
  git(d, 'init', '-q', '-b', 'main', '.');
  put(d, { 'src/lib/a.ts': 'export const a = () => "older";\n', 'CLAUDE.md': 'old rules\n', 'AGENTS.md': 'old agents file, later deleted\n' });
  git(d, 'add', '-A'); git(d, 'commit', '-q', '-m', 'first (#7)');
  const first = git(d, 'rev-parse', 'HEAD');
  git(d, 'rm', '-q', 'AGENTS.md');
  put(d, {
    'package.json': '{"name":"s","version":"1.0.0"}\n', 'package-lock.json': '{"lockfileVersion":3}\n', '.nvmrc': '22.1.0\n', '.gitignore': 'node_modules/\n',
    'src/lib/a.ts': 'export const a = () => "old";\n', 'src/lib/b.ts': 'import { a } from "./a";\nexport const b = a();\n',
    'tests/unit/a.test.ts': 'needs:src/lib/a.ts:old\n', 'tests/unit/other.test.ts': 'needs:src/lib/b.ts:import\n', 'tests/e2e/x.test.ts': 'needs:src/lib/a.ts:old\n',
    'CLAUDE.md': 'rules\n', 'docs/CLAUDE.md': 'rules\n', '.claude/skills/dev/SKILL.md': 'skill\n', '.claude/settings.json': '{}\n', 'docs/sessions/dev.md': 'role\n', 'docs/guide.md': 'guide\n',
  });
  git(d, 'add', '-A'); git(d, 'commit', '-q', '-m', 'second');
  const second = git(d, 'rev-parse', 'HEAD');
  put(d, { 'CLAUDE.md': 'rules, second edition\n' });
  git(d, 'add', '-A'); git(d, 'commit', '-q', '-m', 'rules only');
  const prefix = git(d, 'rev-parse', 'HEAD');
  put(d, { 'src/lib/a.ts': 'export const a = () => "fixed";\n', 'tests/unit/a.test.ts': `needs:src/lib/a.ts:fixed\n# ${SECRET}\n`, 'tests/unit/a-fix.test.ts': `needs:src/lib/a.ts:fixed\n# ${SECRET}\n` });
  git(d, 'add', '-A'); git(d, 'commit', '-q', '-m', 'fix');
  const reference = git(d, 'rev-parse', 'HEAD');
  git(d, 'tag', 'v-after-fix');
  // The filtered mirror, as git-filter-repo would leave it: the same commits without the harness
  // files, the harness-only commit pruned, and the commit map.
  const m = mkdtempSync(join(tmpdir(), 'pw-filt-'));
  git(m, 'init', '-q', '-b', 'main', '.');
  const gone = (p) => /(^|\/)(CLAUDE|AGENTS)\.md$|^\.claude\/|^docs\/sessions\//.test(p);
  const map = [];
  for (const [c, keep] of [[first, true], [second, true], [prefix, false], [reference, true]]) {
    if (!keep) { map.push(`${c} ${'0'.repeat(40)}`); continue; }
    for (const p of git(m, 'ls-files').split('\n').filter(Boolean)) rmSync(join(m, p), { force: true });
    for (const p of git(d, 'ls-tree', '-r', '--name-only', c).split('\n').filter((x) => x && !gone(x))) { mkdirSync(join(m, p, '..'), { recursive: true }); writeFileSync(join(m, p), spawnSync('git', ['show', `${c}:${p}`], { cwd: d }).stdout); }
    git(m, 'add', '-A'); git(m, 'commit', '-q', '-m', git(d, 'log', '-1', '--format=%s', c));
    map.push(`${c} ${git(m, 'rev-parse', 'HEAD')}`);
  }
  mkdirSync(join(m, '.git', 'filter-repo'));
  writeFileSync(join(m, '.git', 'filter-repo', 'commit-map'), `old new\n${map.join('\n')}\n`);
  return { dir: d, prefix, reference, first, filtered: join(m, '.git') };
}
const taskOf = (s) => { const d = deriveTask(s.dir, s.prefix, s.reference); const f = join(mkdtempSync(join(tmpdir(), 'pw-task-')), 't.json'); writeFileSync(f, JSON.stringify({ id: 't1', repo: 'o/r', issue: 7, pr: 99, prefix_commit: s.prefix, reference_commit: s.reference, hidden_checks: d.hidden_checks, sibling_tests: d.sibling_tests, impl_files: d.impl_files, limits: { hidden_sec: 20, q4_sec: 20 } })); return loadTask(f); };
// Unpack a context's dotgit.tar and give a git runner on it.
function unpack(ctx) {
  const d = mkdtempSync(join(tmpdir(), 'pw-dotgit-'));
  spawnSync('tar', ['-xf', join(ctx, 'dotgit.tar').replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, x) => `/${x.toLowerCase()}`), '-C', d.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, x) => `/${x.toLowerCase()}`)]);
  return (...a) => spawnSync('git', a, { cwd: d, encoding: 'utf8' });
}
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));

test('harness patterns: directory prefix, a name at any depth, an exact path', () => {
  assert.equal(matches('.claude/', '.claude/skills/x/SKILL.md'), true);
  assert.equal(matches('.claude/', 'docs/.claude/x'), false);
  assert.equal(matches('**/CLAUDE.md', 'CLAUDE.md'), true);
  assert.equal(matches('**/CLAUDE.md', 'src/routes/CLAUDE.md'), true);
  assert.equal(matches('**/CLAUDE.md', 'docs/NOT-CLAUDE.md'), false);
  assert.equal(matches('.github/copilot-instructions.md', '.github/copilot-instructions.md'), true);
  const all = ['CLAUDE.md', '.claude/skills/dev/SKILL.md', 'docs/sessions/dev.md', 'docs/guide.md', 'src/a.ts'];
  assert.deepEqual(removedPaths(all, HARNESS), ['CLAUDE.md', '.claude/skills/dev/SKILL.md', 'docs/sessions/dev.md']);
  assert.deepEqual(emptiedDirs(all, removedPaths(all, HARNESS)), ['.claude/skills/dev', '.claude/skills', 'docs/sessions', '.claude']);
});

test('a task pointer is validated; the mechanical parts come from the two commits', () => {
  assert.equal(validateTask({ id: 'x', repo: 'o/r', prefix_commit: 'a'.repeat(40), reference_commit: 'b'.repeat(40), hidden_checks: ['t/a.test.ts'] }).length, 0);
  const bad = validateTask({ id: 'X y', repo: 'r', prefix_commit: 'abc', reference_commit: 'b'.repeat(40), hidden_checks: ['../x'] });
  assert.equal(bad.length, 4);
  const s = subject();
  const d = deriveTask(s.dir, s.prefix, s.reference);
  assert.deepEqual(d.hidden_checks, ['tests/unit/a-fix.test.ts', 'tests/unit/a.test.ts']);
  assert.deepEqual(d.hidden_new, ['tests/unit/a-fix.test.ts']);
  assert.deepEqual(d.impl_files, ['src/lib/a.ts']);
  assert.deepEqual(d.sibling_tests, ['tests/unit/other.test.ts']); // same directory only
});

test('contexts: every arm gets the history up to the pre-fix commit; A/B/C without the harness files in any commit; the fix is in no object store', () => {
  const s = subject(), task = taskOf(s);
  const out = mkdtempSync(join(tmpdir(), 'pw-out-'));
  const info = writeContexts(task, { gitDir: s.dir, filteredDir: s.filtered, outDir: out, harness: HARNESS });
  assert.equal(info.nodeVersion, '22.1.0');
  assert.deepEqual(info.removed.sort(), ['.claude/settings.json', '.claude/skills/dev/SKILL.md', 'CLAUDE.md', 'docs/CLAUDE.md', 'docs/sessions/dev.md']);
  assert.deepEqual([info.history.d.commits, info.history.abc.commits, info.history.abc.prunedPrefix, info.history.d.mentions, info.history.abc.mentions], [3, 2, true, 1, 1]); // "first (#7)" names the issue
  const abc = unpack(info.contexts.abc), d = unpack(info.contexts.d);
  for (const g of [abc, d]) {
    assert.equal(g('for-each-ref', '--format=%(refname)').stdout.trim(), 'refs/heads/main'); // no tag, no remote, no other branch
    assert.equal(g('remote').stdout.trim(), '');
    assert.notEqual(g('cat-file', '-e', `${s.reference}^{commit}`).status, 0); // the fix commit is not there
    assert.notEqual(g('show', s.reference).status, 0);
    assert.equal(g('fsck', '--unreachable', '--no-reflogs').stdout.trim(), ''); // nothing dangling
    const blobs = g('cat-file', '--batch-all-objects', '--batch-check').stdout.split('\n').filter((l) => / blob /.test(l)).map((l) => l.split(' ')[0]);
    for (const b of blobs) assert.equal(g('cat-file', '-p', b).stdout.includes(SECRET) || g('cat-file', '-p', b).stdout.includes('"fixed"'), false);
    assert.equal(g('log', '--format=%s', 'main').stdout.includes('fix'), false);
    assert.ok(g('ls-tree', '-r', '--name-only', 'main').stdout.includes('src/lib/a.ts'));
    assert.equal(g('ls-tree', '-r', '--name-only', 'main').stdout.includes('tests/unit/a-fix.test.ts'), false);
  }
  // D: the real history, harness files and all. A/B/C: no harness path in ANY commit, also not one deleted before the pre-fix commit.
  assert.equal(d('rev-parse', 'main').stdout.trim(), s.prefix);
  assert.match(d('log', '--all', '--name-only', '--format=').stdout, /CLAUDE\.md[\s\S]*|AGENTS\.md/);
  assert.ok(d('ls-tree', '-r', '--name-only', 'main').stdout.includes('.claude/skills/dev/SKILL.md'));
  assert.equal(/CLAUDE\.md|AGENTS\.md|\.claude\/|docs\/sessions/.test(abc('log', '--all', '--name-only', '--format=').stdout), false);
  assert.equal(/CLAUDE|AGENTS|\.claude|sessions/.test(abc('rev-list', '--all', '--objects').stdout), false);
  assert.equal(abc('log', '--format=%s', 'main').stdout.trim(), 'second\nfirst (#7)');
  assert.ok(abc('ls-tree', '-r', '--name-only', 'main').stdout.includes('docs/guide.md'));
  assert.equal(abc('blame', '--porcelain', 'main', '--', 'src/lib/b.ts').status, 0);
  // shallow on request
  const sh = writeContexts({ ...task, id: 't2' }, { gitDir: s.dir, filteredDir: s.filtered, outDir: out, harness: HARNESS, depth: 1 });
  assert.deepEqual([sh.history.d.commits, sh.history.abc.commits], [1, 1]);
  for (const c of Object.values(info.contexts)) for (const f of walk(c)) if (!f.endsWith('.tar')) assert.equal(readFileSync(f, 'utf8').includes(SECRET), false, f);
  assert.match(readFileSync(join(info.contexts.deps, 'Dockerfile'), 'utf8'), /^FROM pitwall\/realrepo-node:22\.1\.0\n/);
  assert.match(readFileSync(join(info.contexts.abc, 'Dockerfile'), 'utf8'), new RegExp(`^FROM pitwall/realrepo-deps:${info.lockHash}\\n`));
  assert.match(readFileSync(join(info.contexts.abc, 'Dockerfile'), 'utf8'), /ADD dotgit\.tar \/app\/\nRUN cd \/app && git reset -q --hard main/);
  assert.match(readFileSync(join(info.contexts.abc, 'Dockerfile'), 'utf8'), /cp \/opt\/pitwall\/rec\/node-wrapper\.sh \/usr\/local\/bin\/node/); // the recorder is the last layer
  assert.equal(existsSync(join(info.contexts.d, 'pitwall-rec', 'recorder.mjs')) && existsSync(join(info.contexts.d, 'pitwall-rec', 'vitest-reporter.mjs')), true);
  assert.throws(() => writeContexts(task, { gitDir: s.dir, outDir: out, harness: HARNESS }), /filtered history mirror is required/);
  // A mirror whose tree is not the pre-fix tree minus the harness files is refused, not approximated.
  assert.throws(() => writeContexts(task, { gitDir: s.dir, filteredDir: s.filtered, outDir: out, harness: { remove: [{ pattern: '**/CLAUDE.md' }] } }), /is not the pre-fix tree/);
});

test('arms: same request; B adds one document hidden from git, C adds skills and the entry, D the full tree', () => {
  const s = subject(), task = taskOf(s);
  const out = mkdtempSync(join(tmpdir(), 'pw-arms-'));
  const doc = join(out, 'req.md'); writeFileSync(doc, '- requirement one\n');
  const skills = join(out, 'sk'); put(skills, { 'dev/SKILL.md': 'the skill\n' });
  const mk = (arm, extra = {}) => compileArm(join(out, 'harbor', arm + (extra.script ? `-${extra.script}` : '')), task, arm, { gitDir: s.dir, instruction: 'Fix the bug.', requirementsDoc: doc, skills, entry: '/dev', ...extra });
  const A = mk('A'), B = mk('B'), C = mk('C'), D = mk('D');
  const read = (r, p) => readFileSync(join(r.dir, p), 'utf8');
  assert.equal(read(A, 'instruction.md'), 'Fix the bug.\n');
  assert.equal(read(B, 'instruction.md'), 'Fix the bug.\n');
  assert.equal(read(D, 'instruction.md'), 'Fix the bug.\n');
  assert.equal(read(C, 'instruction.md'), '/dev Fix the bug.\n');
  assert.equal(read(A, 'environment/Dockerfile'), 'FROM pitwall/realrepo-tree:t1-abc\nWORKDIR /app\n');
  assert.equal(read(C, 'environment/Dockerfile'), read(A, 'environment/Dockerfile'));
  assert.equal(read(D, 'environment/Dockerfile'), 'FROM pitwall/realrepo-tree:t1-d\nWORKDIR /app\n');
  assert.match(read(B, 'environment/Dockerfile'), /COPY CLAUDE\.md \/app\/CLAUDE\.md\nRUN echo 'CLAUDE\.md' >> \/app\/\.git\/info\/exclude/);
  assert.equal(read(B, 'environment/CLAUDE.md'), '- requirement one\n');
  assert.equal(existsSync(join(out, 'harbor', 'C', 'skills', 'dev', 'SKILL.md')), true);
  for (const arm of ['A', 'B', 'D']) assert.equal(existsSync(join(out, 'harbor', arm, 'skills')), false);
  assert.deepEqual([A.requirementsDocChars, B.requirementsDocChars, C.entry, C.skills, D.tree], [0, 18, '/dev', true, 'd']);
  // The hidden checks and the reference fix are only in tests/ (uploaded after the agent ends).
  for (const r of [A, B, C, D]) {
    assert.equal(read(r, 'tests/hidden/tests/unit/a-fix.test.ts').includes(SECRET), true);
    assert.match(read(r, 'tests/reference-impl.patch'), /src\/lib\/a\.ts/);
    const fa = JSON.parse(read(r, 'tests/fix-absent.json'));
    assert.equal(fa.fixCommit, s.reference);
    assert.ok(Array.isArray(fa.lineKeys) && fa.lineKeys.every((k) => /^[0-9a-f]{20}$/.test(k)));
    assert.doesNotMatch(read(r, 'tests/reference-impl.patch'), /a-fix\.test/);
    for (const f of [...walk(join(r.dir, 'environment')), join(r.dir, 'instruction.md'), join(r.dir, 'task.toml')]) assert.equal(readFileSync(f, 'utf8').includes(SECRET), false, f);
    assert.equal(existsSync(join(r.dir, 'solution')), false);
    assert.match(read(r, 'task.toml'), /\[verifier\]\ntimeout_sec = 1500\.0/);
  }
  assert.throws(() => compileArm(join(out, 'x'), task, 'B', { gitDir: s.dir, instruction: 'x' }), /requirements document/);
  assert.throws(() => compileArm(join(out, 'x'), task, 'E', { gitDir: s.dir, instruction: 'x' }), /unknown arm/);
  // Scripted controls: the reference fix, and doing nothing.
  const ref = mk('A', { script: 'reference' }), noop = mk('A', { script: 'noop' });
  assert.match(read(ref, 'solution/solve.sh'), /git apply/);
  assert.match(read(noop, 'solution/solve.sh'), /\ntrue\n$/);
  assert.equal(readFileSync(join(out, 'harbor', 'A-reference', 'harbor-tasks', '.script'), 'utf8'), 'reference');
});

// A working copy of the pre-fix tree as the image has it (harness removed, one commit, node_modules ignored).
function workTree(s) {
  const d = mkdtempSync(join(tmpdir(), 'pw-app-'));
  spawnSync('git', ['-c', 'core.autocrlf=false', 'archive', '--format=tar', '-o', join(d, 't.tar'), s.prefix], { cwd: s.dir });
  spawnSync('tar', ['-xf', 't.tar'], { cwd: d }); rmSync(join(d, 't.tar'));
  for (const p of ['CLAUDE.md', 'docs/CLAUDE.md', '.claude', 'docs/sessions']) rmSync(join(d, p), { recursive: true, force: true });
  git(d, 'init', '-q', '-b', 'main', '.'); git(d, 'add', '-A'); git(d, 'commit', '-q', '-m', 'snapshot');
  put(d, { 'node_modules/big/index.js': 'x'.repeat(5000), 'node_modules/.bin/vitest': 'x' });
  return d;
}

test('end-state capture: only what changed, with ignore rules respected and size limits applied', () => {
  const s = subject(), app = workTree(s);
  const head = git(app, 'rev-parse', 'HEAD');
  const fx = join(mkdtempSync(join(tmpdir(), 'pw-fx-')), 'fixture-head'); writeFileSync(fx, `${head}\n`);
  put(app, { 'src/lib/a.ts': 'export const a = () => "mine";\n', 'tests/unit/mine.test.ts': 'new test\n', 'notes.md': 'report\n', 'tests/e2e/x.test.ts': null, 'big.bin': 'y'.repeat(3000), 'big2.txt': 'z'.repeat(900), 'big3.txt': 'w'.repeat(900) });
  const rec = mkdtempSync(join(tmpdir(), 'pw-rec-'));
  writeFileSync(join(rec, '1.start.json'), JSON.stringify({ id: '1', tool: 'vitest', argv: ['v', 'run'], cwd: app, ts: '2026-01-01T00:00:00Z', tree: 'a'.repeat(40), srcTree: 'b'.repeat(40) }));
  writeFileSync(join(rec, '1.end.json'), JSON.stringify({ id: '1', exit: 1, signal: null, ts: '2026-01-01T00:00:05Z', durationMs: 5000, tree: 'a'.repeat(40), srcTree: 'b'.repeat(40), tests: { summary: { passed: 0 }, files: [{ file: 't', status: 'failed', tests: [] }] } }));
  const st = capture(app, { fixtureHeadFile: fx, recDir: rec, readRecords, limits: { fileBytes: 2000, totalBytes: 1000, changedFiles: 2000, recordBytes: 4 << 20 } });
  assert.deepEqual(Object.keys(st.files).sort(), ['big.bin', 'big2.txt', 'big3.txt', 'notes.md', 'src/lib/a.ts', 'tests/unit/mine.test.ts']);
  assert.equal(Object.keys(st.real.tree).some((p) => p.startsWith('node_modules')), false);
  assert.equal(JSON.stringify(st).includes('node_modules'), false);
  assert.ok(st.real.tree['src/lib/b.ts'] && !st.files['src/lib/b.ts']); // unchanged: listed, not copied
  assert.deepEqual(st.real.deleted, ['tests/e2e/x.test.ts']);
  assert.equal(st.files['big.bin'].b64, ''); // over the per-file limit: hash only
  assert.match(st.files['big.bin'].sha256, /^[0-9a-f]{64}$/);
  assert.deepEqual([st.real.truncated.overFile, st.real.truncated.overTotal], [1, 1]); // big3 no longer fits the total
  assert.equal(Buffer.from(st.files['src/lib/a.ts'].b64, 'base64').toString(), 'export const a = () => "mine";\n');
  assert.equal(st.git.fixtureIntact, true);
  assert.deepEqual(st.real.records.map((r) => [r.tool, r.exit, r.ended]), [['vitest', 1, true]]);
  assert.match(st.finalTree, /^[0-9a-f]{40}$/);
  assert.equal(git(app, 'status', '--porcelain').includes('A  '), false); // the real index is untouched
  // The older reader still reads it.
  const f = join(rec, 'state.json'); writeFileSync(f, JSON.stringify(st));
  const old = readState(f);
  assert.equal(old.files['notes.md'].text, 'report\n');
  assert.equal(old.git.fixtureIntact, true);
  assert.equal(old.finalTree, st.finalTree);
  // A change of count limit is reported, not silently cut.
  assert.equal(capture(app, { fixtureHeadFile: fx, recDir: rec, readRecords, limits: { fileBytes: 2000, totalBytes: 1 << 20, changedFiles: 2, recordBytes: 10 } }).real.truncated.overCount, 4);
});

// A stand-in for the test runner: a test file "needs:<file>:<token>" passes when <file> contains <token>.
const RUNNER = `import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const [report, ...files] = process.argv.slice(2);
if (process.env.FAKE_HANG) await new Promise((r) => setTimeout(r, 60000));
const res = files.map((f) => { const m = readFileSync(f, 'utf8').match(/^needs:([^:]+):(.+)$/m); const ok = !m || (existsSync(m[1]) && readFileSync(m[1], 'utf8').includes(m[2])); return { name: process.cwd().replace(/\\\\/g, '/') + '/' + f, status: ok ? 'passed' : 'failed', assertionResults: [{ fullName: f + ' > t', status: ok ? 'passed' : 'failed' }] }; });
writeFileSync(report, JSON.stringify({ testResults: res }));
process.exit(res.every((r) => r.status === 'passed') ? 0 : 1);
`;
function hiddenSetup(s) {
  const task = taskOf(s), app = workTree(s);
  const out = mkdtempSync(join(tmpdir(), 'pw-hid-'));
  const arm = compileArm(join(out, 'harbor', 'A'), task, 'A', { gitDir: s.dir, instruction: 'x' });
  const runnerFile = join(out, 'runner.mjs'); writeFileSync(runnerFile, RUNNER);
  const runner = (files, report) => [process.execPath, runnerFile, report, ...files];
  return { task, app, tests: join(arm.dir, 'tests'), out: join(out, 'verifier'), runner, s };
}

test('hidden checks: doing nothing fails them, the reference fix passes them', () => {
  const s = subject();
  const noop = hiddenSetup(s);
  const r0 = hiddenRun(noop.app, noop.tests, noop.out, { runner: noop.runner });
  assert.deepEqual([r0.hidden.allPassed, r0.hidden.anyFailed, r0.hidden.tests, r0.hidden.failed], [false, true, 2, 2]);
  assert.equal(r0.siblings.allPassed, true);
  assert.equal(r0.q4, null); // no tests of its own
  const ref = hiddenSetup(s);
  const patch = join(ref.out, '..', 'ref.patch'); writeFileSync(patch, spawnSync('git', ['diff', '--binary', s.prefix, s.reference], { cwd: s.dir }).stdout);
  git(ref.app, 'apply', patch);
  const r1 = hiddenRun(ref.app, ref.tests, ref.out, { runner: ref.runner });
  assert.deepEqual([r1.hidden.allPassed, r1.hidden.anyFailed, r1.hidden.passed], [true, false, 2]);
  assert.deepEqual(r1.collisions, []); // same bytes as the hidden files: not a collision
  assert.match(controlScripts(ref.task, { gitDir: s.dir }).reference, /git apply/);
});

test('hidden checks: a file the agent wrote at the same path is reported and does not replace the check', () => {
  const h = hiddenSetup(subject());
  put(h.app, { 'src/lib/a.ts': 'export const a = () => "fixed";\n', 'tests/unit/a-fix.test.ts': 'needs:src/lib/a.ts:NEVER\n', 'tests/unit/a.test.ts': 'needs:src/lib/a.ts:NEVER\n' });
  const r = hiddenRun(h.app, h.tests, h.out, { runner: h.runner });
  assert.deepEqual(r.collisions, [{ path: 'tests/unit/a-fix.test.ts', kind: 'agent-created' }, { path: 'tests/unit/a.test.ts', kind: 'agent-changed-existing' }]);
  assert.equal(r.hidden.allPassed, true); // the hidden versions ran, not the agent's
  assert.equal(readFileSync(join(h.out, 'agent-tests', 'tests/unit/a-fix.test.ts'), 'utf8'), 'needs:src/lib/a.ts:NEVER\n'); // kept aside
});

test('Q4: the agent\'s own tests are run on the pre-fix and on the reference implementation', () => {
  const good = hiddenSetup(subject());
  put(good.app, { 'src/lib/a.ts': 'export const a = () => "fixed";\n', 'tests/unit/mine.test.ts': 'needs:src/lib/a.ts:fixed\n' });
  const r = hiddenRun(good.app, good.tests, good.out, { runner: good.runner });
  assert.deepEqual([r.q4.files, r.q4.applied, r.q4.failsOnPrefix, r.q4.passesOnReference], [1, true, true, true]);
  const vacuous = hiddenSetup(subject());
  put(vacuous.app, { 'tests/unit/mine.test.ts': 'always passes\n' });
  const v = hiddenRun(vacuous.app, vacuous.tests, vacuous.out, { runner: vacuous.runner });
  assert.deepEqual([v.q4.failsOnPrefix, v.q4.passesOnReference], [false, true]); // passes without the fix: tests nothing
  assert.equal(existsSync(join(vacuous.app, 'node_modules/big/index.js')), true); // ignored files survive the reset
});

test('hidden checks: a run over its time limit is recorded as timed out, not as a failure of the tests', () => {
  const h = hiddenSetup(subject());
  const cfg = JSON.parse(readFileSync(join(h.tests, 'hidden.json'), 'utf8'));
  writeFileSync(join(h.tests, 'hidden.json'), JSON.stringify({ ...cfg, hiddenSec: 1 }));
  process.env.FAKE_HANG = '1';
  let r;
  try { r = hiddenRun(h.app, h.tests, h.out, { runner: h.runner }); } finally { delete process.env.FAKE_HANG; }
  assert.equal(r.run.timedOut, true);
  assert.deepEqual([r.hidden.allPassed, r.hidden.anyFailed, r.run.reported], [false, false, false]);
});
