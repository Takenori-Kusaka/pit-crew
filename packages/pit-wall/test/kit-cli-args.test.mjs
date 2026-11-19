// The kit's command-line tools check their arguments before they do anything (src/kit/cli-args.mjs).
// `perturb.mjs --help` and `regrade.mjs --help` used to ignore the word, run, and overwrite their default result
// file (2026-11-16: two roles lost uncommitted results this way). Every tool here is started with --help, -h and an
// unknown argument; none may write, run a model, or start docker, and the result files of the repository must be
// byte-for-byte what they were.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from '../src/kit/cli-args.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const K = 'packages/pit-wall/src/kit';
const FIXTURE = 'packages/pit-wall/test/fixtures/kit/dev-basic';   // a fixed template of the tests (kit-templates.mjs)
// every file under kit/results and kit/cases, by content: what a stray run would overwrite
function snapshot() {
  const out = {};
  const walk = (d) => { for (const e of existsSync(d) ? readdirSync(d, { withFileTypes: true }) : []) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else out[p] = `${statSync(p).mtimeMs}:${createHash('sha256').update(readFileSync(p)).digest('hex')}`; } };
  walk(join(ROOT, 'kit/results')); walk(join(ROOT, 'kit/cases'));
  return out;
}
const run = (tool, args) => { const { NODE_TEST_CONTEXT: _c, ...env } = process.env; return spawnSync(process.execPath, [join(ROOT, tool), ...args], { cwd: ROOT, encoding: 'utf8', env, timeout: 120000 }); };

// tool, and arguments that are otherwise complete (so that only the word under test decides)
const TOOLS = [
  [`${K}/perturb.mjs`, []],
  [`${K}/regrade.mjs`, []],
  [`${K}/gen-cases.mjs`, ['kit/roles/dev.yaml', FIXTURE, 'OUT']],
  [`${K}/mutation-check.mjs`, []],
  [`${K}/pilot-items.mjs`, ['dev=kit/results/dev/delta.runs.jsonl']],
  [`${K}/probe-summary.mjs`, ['dev-cart5']],
  [`${K}/run-delta.mjs`, ['--role', 'dev', '--harness', 'no-such-harness']],
  [`${K}/summarize-eval.mjs`, []],
  [`${K}/summarize-eval3.mjs`, []],
  ['scripts/kit-check.mjs', []],
  ['scripts/release-gate.mjs', ['dev']],
  ['kit/gen-enforce.mjs', ['kit/roles/dev.yaml', '--out', 'OUT']],
];

const scratch = mkdtempSync(join(tmpdir(), 'kit-cli-'));
test.after(() => rmSync(scratch, { recursive: true, force: true }));
const fill = (args) => args.map((a) => (a === 'OUT' ? join(scratch, 'out') : a));
const before = snapshot();

for (const [tool, args] of TOOLS) {
  test(`${tool}: --help and -h print the usage and do nothing else`, () => {
    for (const h of ['--help', '-h']) for (const argv of [[h], [...fill(args), h], [h, ...fill(args)]]) {
      const r = run(tool, argv);
      assert.equal(r.status, 0, `${argv.join(' ')}: ${r.stderr}`);
      assert.match(r.stdout, /^usage: node \S+/, argv.join(' '));
      assert.ok(r.stdout.split('\n').length <= 8, 'the usage, not a run');
      assert.equal(existsSync(join(scratch, 'out')), false, 'nothing was written to the output directory');
    }
  });
  test(`${tool}: an unknown argument stops before anything runs (exit 2 or an error, nothing written)`, () => {
    for (const bad of ['--no-such-option', '--helpp', '-x']) {
      const r = run(tool, [...fill(args), bad]);
      assert.notEqual(r.status, 0, `${bad}: ${r.stdout.slice(0, 200)}`);
      assert.ok(r.status === 2 || tool === 'kit/gen-enforce.mjs', `${bad}: exit ${r.status}`);
      assert.match(r.stderr, new RegExp(`(unknown argument|知らない引数): ${bad}`), bad);
      assert.equal(existsSync(join(scratch, 'out')), false);
    }
  });
}

test('none of those calls changed a result file of the repository', () => {
  assert.deepEqual(snapshot(), before);
});

test('a value-taking option without its value, and plain arguments the tool does not take, stop it too', () => {
  let r = run(`${K}/perturb.mjs`, ['--out']);
  assert.equal(r.status, 2); assert.match(r.stderr, /--out needs a value/);
  r = run(`${K}/perturb.mjs`, ['kit/results/perturb.json']);
  assert.equal(r.status, 2); assert.match(r.stderr, /unexpected argument: kit\/results\/perturb\.json/);
  r = run(`${K}/regrade.mjs`, ['no-such-role']);
  assert.equal(r.status, 2); assert.match(r.stderr, /no saved runs for: no-such-role/);
  r = run(`${K}/gen-cases.mjs`, ['kit/roles/dev.yaml']);
  assert.equal(r.status, 2); assert.match(r.stderr, /too few arguments/);
  r = run(`${K}/pilot-items.mjs`, []);
  assert.equal(r.status, 2); assert.match(r.stderr, /missing argument/);
  r = run(`${K}/pilot-items.mjs`, ['dev']);
  assert.equal(r.status, 2); assert.match(r.stderr, /not <fixture>=<runs\.jsonl>: dev/);
  r = run(`${K}/probe-summary.mjs`, []);
  assert.equal(r.status, 2);
  r = run(`${K}/probe-summary.mjs`, ['no-such-fixture']);
  assert.equal(r.status, 2); assert.match(r.stderr, /no such fixture: no-such-fixture/);
  r = run(`${K}/summarize-eval.mjs`, ['no/such/dir']);
  assert.equal(r.status, 2); assert.match(r.stderr, /no such directory/);
  r = run('scripts/release-gate.mjs', ['dev', 'qm', '--plan']);
  assert.equal(r.status, 2); assert.match(r.stderr, /unexpected argument: qm/);
  r = run('scripts/release-gate.mjs', ['--plan']);
  assert.equal(r.status, 2); assert.match(r.stderr, /missing argument: <role>/);
  r = run(`${K}/run-delta.mjs`, ['--role', 'dev']);
  assert.equal(r.status, 2); assert.match(r.stderr, /--role and --harness are needed/);
  assert.deepEqual(snapshot(), before);
});

test('the tools still do their work with the arguments they take', () => {
  const out = join(scratch, 'perturb.json');
  // one template only: this test is about the arguments, not about every fixture (the whole self-check is
  // kit-perturb.test.mjs). With every fixture, a run without remembered replays went over the 120 s limit.
  let r = run(`${K}/perturb.mjs`, ['--out', out, '--fixtures', FIXTURE]);
  assert.equal(r.status, 0, r.stderr);
  const roles = JSON.parse(readFileSync(out, 'utf8')).roles;
  assert.deepEqual(Object.keys(roles), ['dev-basic']);
  assert.equal(roles['dev-basic'].original.pass, true);
  assert.equal(run(`${K}/perturb.mjs`, ['--out', out, '--fixtures', 'no/such/fixture']).status, 1, 'a directory without a fixture stops');
  const reg = join(scratch, 'regrade.json');
  r = run(`${K}/regrade.mjs`, ['--out', reg, 'qm']);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(reg, 'utf8')).roles), ['qm']);
  const cases = join(scratch, 'cases'), res = join(scratch, 'gen.json');
  r = run(`${K}/gen-cases.mjs`, ['kit/roles/dev.yaml', FIXTURE, cases, '--result', res]);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.equal(JSON.parse(readFileSync(res, 'utf8')).ok, true);
  r = run(`${K}/mutation-check.mjs`, ['--out', join(scratch, 'mut.json')]);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(scratch, 'mut.json')));
  r = run('scripts/release-gate.mjs', ['qm', '--plan']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^plan: /m);
  assert.deepEqual(snapshot(), before);
});

test('parseArgs: flags, options, plain arguments, and what is refused', () => {
  const spec = { flags: ['plan'], options: ['out'], min: 1, max: 2 };
  assert.deepEqual(parseArgs(['dev', '--plan', '--out', 'x.json', 'b'], spec), { flags: { plan: true }, options: { out: 'x.json' }, rest: ['dev', 'b'] });
  assert.deepEqual(parseArgs(['--help'], spec), { help: true });
  assert.deepEqual(parseArgs(['dev', '--nope', '-h'], spec), { help: true }, 'help wins: nothing runs');
  assert.deepEqual(parseArgs(['dev', '--nope'], spec), { error: 'unknown argument: --nope' });
  assert.deepEqual(parseArgs(['dev', '--out=x'], spec), { error: 'unknown argument: --out=x' });
  assert.deepEqual(parseArgs(['dev', '--out'], spec), { error: '--out needs a value' });
  assert.deepEqual(parseArgs(['dev', '--out', '--plan'], spec), { error: '--out needs a value' });
  assert.deepEqual(parseArgs([], spec), { error: 'missing argument (at least 1)' });
  assert.deepEqual(parseArgs(['a', 'b', 'c'], spec), { error: 'unexpected argument: c' });
  assert.deepEqual(parseArgs(['a', '-1'], spec).rest, ['a', '-1'], 'a number is not an option');
});
