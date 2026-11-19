// Run recording for a real repository (plan 34 §9 instrument 5): every form of running a check
// tool leaves a record with argv, cwd, exit code, tree and per-test results, also when the run
// is killed, and the caller sees the same output and exit code as without the recorder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { identify, readRecords, scriptIndex, treeHash, vitestExtra, vitestTests } from '../shims/realrepo/recorder.mjs';
import { SHIMS, shell } from './shell-helpers.mjs';

const RECORDER = fileURLToPath(new URL('../shims/realrepo/recorder.mjs', import.meta.url));

function project() {
  const d = mkdtempSync(join(tmpdir(), 'pw-rec-'));
  const w = (p, t) => { mkdirSync(join(d, p, '..'), { recursive: true }); writeFileSync(join(d, p), t); };
  w('node_modules/vitest/vitest.mjs', `import { writeFileSync } from 'node:fs';
const a = process.argv.slice(2);
const out = process.env.PITWALL_VITEST_OUT;
console.log('FAKE-VITEST ' + a.map((x) => (x.includes('vitest-reporter.mjs') ? '--reporter=<silent>' : x)).join(' '));
const fail = a.includes('fail.test.ts');
if (out) writeFileSync(out, JSON.stringify({ numTotalTestSuites: 1, numTotalTests: 2, numPassedTests: fail ? 1 : 2, numFailedTests: fail ? 1 : 0, success: !fail, testResults: [{ name: process.cwd().replace(/\\\\/g, '/') + '/tests/unit/a.test.ts', status: fail ? 'failed' : 'passed', assertionResults: [{ fullName: 'a one', status: 'passed' }, { fullName: 'a two', status: fail ? 'failed' : 'passed' }] }] }));
process.exit(fail ? 1 : 0);
`);
  w('node_modules/typescript/bin/tsc', 'console.log("FAKE-TSC " + process.argv.slice(2).join(" ")); process.exit(2);\n');
  w('scripts/other.mjs', 'console.log("OTHER " + process.argv.slice(2).join(" ")); process.exit(7);\n');
  w('src/a.ts', 'export const a = 1;\n');
  w('tests/unit/a.test.ts', 'test\n');
  w('.gitignore', 'node_modules\n');
  const g = (...args) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'core.autocrlf=false', ...args], { cwd: d });
  g('init', '-q', '.'); g('add', '-A'); g('commit', '-q', '-m', 'init');
  return d;
}
const run = (cwd, args, rec, env = {}) => spawnSync(process.execPath, [RECORDER, ...args], { cwd, encoding: 'utf8', env: { ...process.env, PITWALL_REC_DIR: rec, PITWALL_REAL_NODE: process.execPath, ...env } });

test('the script of a node invocation is found past node options', () => {
  assert.equal(scriptIndex(['a.js', 'x']), 0);
  assert.equal(scriptIndex(['--max-old-space-size=4096', '-r', 'ts-node/register', 'a.js']), 3);
  assert.equal(scriptIndex(['--import', './hook.mjs', 'a.js']), 2);
  assert.equal(scriptIndex(['-e', 'console.log(1)']), -1);
  assert.equal(scriptIndex(['--version']), -1);
  assert.equal(scriptIndex(['--', 'a.js']), 1);
  assert.equal(scriptIndex([]), -1);
});

test('tools are identified by where the script really is; other programs are not recorded', () => {
  const d = project();
  assert.equal(identify(['node_modules/vitest/vitest.mjs', 'run'], d).tool, 'vitest');
  assert.equal(identify(['./node_modules/typescript/bin/tsc', '--noEmit'], d).tool, 'tsc');
  assert.equal(identify(['--max-old-space-size=4096', join(d, 'node_modules/vitest/vitest.mjs')], d).tool, 'vitest');
  assert.equal(identify(['scripts/other.mjs', 'vitest'], d), null); // names a tool, is not one
  assert.equal(identify(['-e', 'require("vitest")'], d), null);
  const npm = (rest) => identify(['/opt/x/lib/node_modules/npm/bin/npm-cli.js', ...rest], d);
  assert.deepEqual(npm(['test']).npm, { sub: 'test', script: 'test' });
  assert.deepEqual(npm(['run', 'check', '--', '--watch']).npm, { sub: 'run', script: 'check' });
  assert.deepEqual(npm(['--silent', 't']).npm, { sub: 't', script: 'test' });
  assert.equal(npm(['install']), null);
  assert.deepEqual(identify(['/opt/x/lib/node_modules/npm/bin/npx-cli.js', 'vitest', 'run'], d).npm, { sub: 'npx', script: 'vitest' });
});

test('vitest gets the silent reporter added without changing what it prints', () => {
  const R = '/opt/r.mjs';
  assert.deepEqual(vitestExtra(['run', 'a.test.ts'], R, ['default']), ['--reporter=default', '--reporter=/opt/r.mjs']);
  assert.deepEqual(vitestExtra(['run', '--reporter=verbose'], R, ['default']), ['--reporter=/opt/r.mjs']);
  assert.deepEqual(vitestExtra(['run', '--reporter', 'dot'], R, ['default']), ['--reporter=/opt/r.mjs']);
  assert.deepEqual(vitestExtra(['run', '--reporter=json', '--outputFile=o.json'], R, ['default']), ['--reporter=/opt/r.mjs']); // the agent's own JSON report is untouched
  assert.deepEqual(vitestExtra(['list'], R, ['default']), []);
  assert.deepEqual(vitestExtra(['--version'], R, ['default']), []);
  assert.deepEqual(vitestExtra([], R, ['default', 'junit']), ['--reporter=default', '--reporter=junit', '--reporter=/opt/r.mjs']);
});

test('the silent reporter writes per-test results in both reporter APIs', async () => {
  const { default: Reporter } = await import('../shims/realrepo/vitest-reporter.mjs');
  const out = join(mkdtempSync(join(tmpdir(), 'pw-vr-')), 'r.json');
  process.env.PITWALL_VITEST_OUT = out;
  try {
    const mod = (id, state, tests) => ({ moduleId: id, state: () => state, children: { allTests: () => tests.map(([n, s]) => ({ fullName: n, result: () => ({ state: s }) })) } });
    new Reporter().onTestRunEnd([mod('/app/a.test.ts', 'failed', [['a > one', 'passed'], ['a > two', 'failed']]), mod('/app/broken.test.ts', 'failed', [])]);
    const j = JSON.parse(readFileSync(out, 'utf8'));
    assert.deepEqual([j.numTotalTests, j.numPassedTests, j.numFailedTests, j.success], [2, 1, 1, false]);
    assert.deepEqual(j.testResults[1], { name: '/app/broken.test.ts', status: 'failed', assertionResults: [] }); // a file that failed to collect: failed, with no test
    new Reporter().onFinished([{ filepath: '/app/b.test.ts', result: { state: 'pass' }, tasks: [{ type: 'suite', name: 'b', tasks: [{ type: 'test', name: 'x', result: { state: 'pass' } }, { type: 'test', name: 'y', mode: 'skip' }] }] }]);
    assert.deepEqual(JSON.parse(readFileSync(out, 'utf8')).testResults, [{ name: '/app/b.test.ts', status: 'passed', assertionResults: [{ fullName: 'b > x', status: 'passed' }, { fullName: 'b > y', status: 'skipped' }] }]);
    new Reporter().onTestRunEnd(null); // nothing to say is not an error
  } finally { delete process.env.PITWALL_VITEST_OUT; }
});

test('a recorded run: argv, cwd, exit code, trees, per-test results; output and exit code unchanged', () => {
  const d = project();
  const rec = mkdtempSync(join(tmpdir(), 'pw-recdir-'));
  const ok = run(d, ['node_modules/vitest/vitest.mjs', 'run', 'tests/unit/a.test.ts'], rec);
  assert.equal(ok.status, 0);
  assert.equal(ok.stdout, 'FAKE-VITEST run tests/unit/a.test.ts --reporter=default --reporter=<silent>\n');
  const bad = run(d, ['node_modules/vitest/vitest.mjs', 'run', 'fail.test.ts'], rec);
  assert.equal(bad.status, 1);
  const tsc = run(d, ['node_modules/typescript/bin/tsc', '--noEmit', '-p', '.'], rec);
  const plain = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '-p', '.'], { cwd: d, encoding: 'utf8' });
  assert.equal(tsc.status, 2);
  assert.equal(tsc.stdout, plain.stdout); // same bytes as without the recorder
  assert.equal(tsc.stderr, plain.stderr);
  const other = run(d, ['scripts/other.mjs', 'vitest', 'x'], rec);
  assert.equal(other.status, 7);
  assert.equal(other.stdout, 'OTHER vitest x\n');
  const rs = readRecords(rec);
  assert.deepEqual(rs.map((r) => [r.tool, r.exit, r.ended]), [['vitest', 0, true], ['vitest', 1, true], ['tsc', 2, true]]);
  assert.deepEqual(rs[0].argv, ['node_modules/vitest/vitest.mjs', 'run', 'tests/unit/a.test.ts']); // as typed, without what was added
  assert.equal(rs[0].cwd, d);
  assert.match(rs[0].tree, /^[0-9a-f]{40}$/);
  assert.equal(rs[0].tests.summary.passed, 2);
  assert.deepEqual(rs[0].tests.files, [{ file: 'tests/unit/a.test.ts', status: 'passed', tests: [{ name: 'a one', status: 'passed' }, { name: 'a two', status: 'passed' }] }]);
  assert.equal(rs[1].tests.files[0].tests[1].status, 'failed');
  assert.equal(rs[2].tests, null);
});

test('the source tree hash moves with source and tests, not with a report file; the full tree moves with both', () => {
  const d = project();
  const t0 = treeHash(d);
  writeFileSync(join(d, 'REPORT.md'), 'done\n');
  mkdirSync(join(d, 'node_modules', 'x'), { recursive: true });
  writeFileSync(join(d, 'node_modules', 'x', 'big.js'), 'ignored\n');
  const t1 = treeHash(d);
  assert.equal(t1.srcTree, t0.srcTree);
  assert.notEqual(t1.tree, t0.tree);
  writeFileSync(join(d, 'src', 'a.ts'), 'export const a = 2;\n');
  const t2 = treeHash(d);
  assert.notEqual(t2.srcTree, t1.srcTree);
  writeFileSync(join(d, 'tests', 'unit', 'b.test.ts'), 'new\n');
  assert.notEqual(treeHash(d).srcTree, t2.srcTree);
  assert.equal(spawnSync('git', ['status', '--porcelain'], { cwd: d, encoding: 'utf8' }).stdout.includes('A '), false); // the real index is untouched
  assert.deepEqual(treeHash(tmpdir()), { tree: null, srcTree: null });
});

test('a broken record directory never changes the run', () => {
  const d = project();
  const blocker = join(mkdtempSync(join(tmpdir(), 'pw-recdir-')), 'file');
  writeFileSync(blocker, 'x');
  const r = run(d, ['node_modules/typescript/bin/tsc', '--noEmit'], join(blocker, 'sub'));
  assert.equal(r.status, 2);
  assert.equal(r.stdout, 'FAKE-TSC --noEmit\n');
  assert.equal(vitestTests(join(d, 'missing.json')), null);
});

// The forms an agent may use, through the `node` wrapper, with the real npm and npx.
test('every invocation form is recorded, a timed-out run and a killed run too (wrapper on PATH)', { timeout: 300000 }, () => {
  const { stdout } = shell(`set -u
REALNODE=$(command -v node)
w=$(mktemp -d); bin=$w/bin; app=$w/app; mkdir -p "$bin" "$app" "$w/opt"
tr -d '\\r' < '${SHIMS}/realrepo/node-wrapper.sh' > "$bin/node"; chmod +x "$bin/node"
tr -d '\\r' < '${SHIMS}/realrepo/recorder.mjs' > "$w/opt/recorder.mjs"
tr -d '\\r' < '${SHIMS}/realrepo/vitest-reporter.mjs' > "$w/opt/vitest-reporter.mjs"
export PITWALL_REAL_NODE=$REALNODE PITWALL_RECORDER=$w/opt/recorder.mjs PITWALL_REC_DIR=$w/rec
export PATH="$bin:$PATH"
cd "$app"
fake() { # package-relative path, tool word, exit code
  mkdir -p "$(dirname "node_modules/$1")"
  printf '#!/usr/bin/env node\\nconst a=process.argv.slice(2);console.log("FAKE-%s "+a.map(x=>x.includes("vitest-reporter.mjs")?"--reporter=<silent>":x).join(" "));const out=process.env.PITWALL_VITEST_OUT;if(out)require("fs").writeFileSync(out,JSON.stringify({numTotalTests:1,numPassedTests:1,numFailedTests:0,success:true,testResults:[{name:process.cwd()+"/t.test.ts",status:"passed",assertionResults:[{fullName:"t",status:"passed"}]}]}));const s=Number(process.env.FAKE_SLEEP||0);setTimeout(()=>process.exit(a.includes("fail")?1:%s),s);\\n' "$2" "$3" > "node_modules/$1"
  chmod +x "node_modules/$1"; mkdir -p node_modules/.bin; ln -sf "../$1" "node_modules/.bin/$2"
}
fake vitest/vitest.cjs vitest 0
fake typescript/bin/tsc tsc 2
fake @biomejs/biome/bin/biome biome 0
fake eslint/bin/eslint.js eslint 0
fake svelte-check/bin/svelte-check svelte-check 0
fake @sveltejs/kit/svelte-kit.js svelte-kit 0
printf '{"name":"x","version":"1.0.0","scripts":{"test":"vitest run","test:unit":"vitest run","check":"svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"}}\\n' > package.json
printf 'node_modules\\n' > .gitignore
mkdir -p src tests/unit sub/dir; echo 1 > src/a.ts
git init -q . && git -c user.name=t -c user.email=t@example.com add -A && git -c user.name=t -c user.email=t@example.com commit -q -m init
codes=
r() { "$@" >> "$w/out.txt" 2>&1; codes="$codes $?"; }
r npx vitest run tests/unit/a.test.ts
r npm test
r npm run test:unit -- tests/unit/a.test.ts
r node_modules/.bin/vitest run
r ./node_modules/.bin/tsc --noEmit
r node node_modules/vitest/vitest.cjs run fail
npx biome check . >> "$w/out.txt" 2>&1 && npx eslint src >> "$w/out.txt" 2>&1; codes="$codes $?"
r bash -c 'cd src && npx svelte-check --tsconfig ../tsconfig.json'
(cd sub/dir && ../../node_modules/.bin/vitest run) >> "$w/out.txt" 2>&1; codes="$codes $?"
r npm run check
r env FOO=1 "$app/node_modules/.bin/tsc" -p .
FAKE_SLEEP=20000 timeout 2 node_modules/.bin/vitest run slow >> "$w/out.txt" 2>&1; codes="$codes $?"
FAKE_SLEEP=20000 node_modules/.bin/vitest run killed >> "$w/out.txt" 2>&1 &
pid=$!; sleep 2; kill -9 $pid; wait $pid 2>/dev/null; codes="$codes $?"
pkill -f 'vitest.cjs run killed' || true
# not check tools: no record, same result as the real node
a=$(node -e 'console.log(6*7)'); b=$("$REALNODE" -e 'console.log(6*7)')
v=$(node --version); rv=$("$REALNODE" --version)
echo "CODES$codes"
echo "PLAIN $a $b $v $rv"
echo "OUT-BEGIN"; cat "$w/out.txt"; echo "OUT-END"
"$REALNODE" --input-type=module -e "import { readRecords } from '$w/opt/recorder.mjs'; console.log('RECORDS ' + JSON.stringify(readRecords('$w/rec').map((r) => ({ tool: r.tool, argv: r.argv.slice(1), cwd: r.cwd.replace('$app', '.'), exit: r.exit ?? null, signal: r.signal ?? null, ended: r.ended, tree: !!r.tree, tests: r.tests ? r.tests.summary.passed : null, parent: !!r.parent, npm: r.npm ? r.npm.script : null }))))"
`);
  const codes = stdout.match(/^CODES(.*)$/m)[1].trim().split(' ').map(Number);
  assert.deepEqual(codes, [0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 2, 124, 137]);
  const [, a, b, v, rv] = stdout.match(/^PLAIN (\S+) (\S+) (\S+) (\S+)$/m);
  assert.equal(a, b); assert.equal(v, rv);
  const out = stdout.slice(stdout.indexOf('OUT-BEGIN'), stdout.indexOf('OUT-END'));
  assert.match(out, /FAKE-vitest run tests\/unit\/a\.test\.ts --reporter=default --reporter=<silent>/);
  assert.match(out, /FAKE-tsc --noEmit\n/);
  const recs = JSON.parse(stdout.match(/^RECORDS (.*)$/m)[1]);
  const of = (tool) => recs.filter((r) => r.tool === tool);
  // 8 direct vitest runs: npx, npm test, npm run, .bin, node <file>, from a subdirectory, timed out, killed
  const vt = of('vitest');
  assert.equal(vt.length, 8, JSON.stringify(vt));
  assert.deepEqual(vt.map((r) => r.argv.join(' ')), ['run tests/unit/a.test.ts', 'run', 'run tests/unit/a.test.ts', 'run', 'run fail', 'run', 'run slow', 'run killed']);
  assert.deepEqual(vt.map((r) => r.exit), [0, 0, 0, 0, 1, 0, null, null]);
  assert.equal(vt[5].cwd, './sub/dir');
  assert.deepEqual([vt[6].ended, vt[6].signal], [true, 'SIGTERM']); // timeout: the record is closed with the signal
  assert.deepEqual([vt[7].ended, vt[7].signal], [false, null]); // SIGKILL: the start record remains, open
  assert.ok(vt.slice(0, 6).every((r) => r.tests === 1 && r.tree));
  assert.deepEqual(vt.map((r) => r.parent), [true, true, true, false, false, false, false, false]); // under npx / npm
  assert.deepEqual(of('tsc').map((r) => [r.argv.join(' '), r.exit]), [['--noEmit', 2], ['-p .', 2]]);
  assert.deepEqual(of('biome').map((r) => r.exit), [0]);
  assert.deepEqual(of('eslint').map((r) => r.argv.join(' ')), ['src']);
  assert.deepEqual(of('svelte-check').map((r) => r.cwd), ['./src', '.']);
  assert.deepEqual(of('svelte-kit').map((r) => r.argv.join(' ')), ['sync']);
  assert.deepEqual(of('npm').map((r) => r.npm), ['test', 'test:unit', 'check']);
  assert.equal(of('npx').length, 4);
});
