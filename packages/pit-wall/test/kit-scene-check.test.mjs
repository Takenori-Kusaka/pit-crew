// scripts/scene-check.mjs (the docker check of the scene staging): what can be tested without a container — the
// arguments, the plan, and the reading of saved trials into the five answers. No docker is started here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { PROBE, plan, render, verdicts } from '../src/kit/scene-check.mjs';
import { ROOT, loadTemplate } from './kit-templates.mjs';

const run = (...args) => spawnSync(process.execPath, [join(ROOT, 'scripts/scene-check.mjs'), ...args], { cwd: ROOT, encoding: 'utf8' });

test('the plan: nine trials, scripted only; --only takes one template', () => {
  const p = plan();
  assert.equal(p.length, 9);
  assert.ok(p.every((t) => t.arm.startsWith('script:') && t.trial === 1));
  assert.deepEqual(p.map((t) => `${t.phase}:${t.fixture}:${t.arm.slice(7)}`), ['controls:dev-scene:null', 'controls:dev-scene:reference', 'controls:dev-scene:incident', 'probe:dev-scene:probe', 'baseline:dev-scene:reference',
    'controls:dev-layer:null', 'controls:dev-layer:reference', 'controls:dev-layer:incident', 'wrong-base:dev-layer:null']);
  assert.equal(plan({ only: 'scene' }).length, 5);
  assert.equal(plan({ only: 'layer' }).length, 4);
  // the controls the plan names exist in the templates
  for (const fx of ['dev-scene', 'dev-layer']) { const k = loadTemplate(fx).cases.find((c) => c.kit.case === 'dev-normal'); for (const n of ['null', 'reference', 'incident']) assert.ok(k.controls[n]?.events, `${fx} ${n}`); }
  assert.ok(!/\bcurl\b|https?:/.test(PROBE), 'the probe reaches nothing outside the container');
});

test('--plan prints the trials and runs nothing; a bad argument stops before anything runs', () => {
  const p = run('--plan');
  assert.equal(p.status, 0, p.stderr);
  assert.match(p.stdout, /9 trials, one container at a time, no model/);
  assert.match(p.stdout, /wrong-base\s+dev-layer\s+script:null/);
  assert.match(run('--plan', '--only', 'scene').stdout, /5 trials/);
  for (const bad of [['--only', 'both'], ['--nope'], ['extra'], ['--min-free-gib', 'x'], ['--out']]) { const r = run(...bad); assert.equal(r.status, 2, bad.join(' ')); assert.match(r.stderr, /Nothing was run/); }
  assert.equal(run('--help').status, 0);
});

// a saved trial as runTrial leaves it, reduced to what the reading uses
const capture = (more = {}) => ({ git: { head_before: 'h1' }, remote: { status: 'made', refs_before: { 'refs/heads/main': 'a', 'refs/heads/develop': 'a', 'refs/heads/work/discount': 'b' }, refs_after: {} }, gh_snapshot: { status: 'made' }, tree: { total: 4 }, ...more });
const row = (phase, fixture, script, cap = capture(), more = {}) => ({ phase, fixture, script, as_built: true, why: null, saved: { wall_seconds: 60, infra_error: null, record: { state: { files: { a: {} } }, kit_facts: { capture: cap } } }, ...more });
const probeRefs = (...names) => capture({ remote: { status: 'made', refs_before: {}, refs_after: Object.fromEntries(names.map((n) => [`refs/heads/probe-${n}`, 'x'])) } });
const all = () => [
  ...['null', 'reference', 'incident'].map((s) => row('controls', 'dev-scene', s)),
  row('probe', 'dev-scene', 'probe', probeRefs('root', 'su', 'user-push', 'user-read', 'node', 'json')),
  row('baseline', 'dev-scene', 'reference', capture({ baseline: { source: 'verifier', differs: [] } })),
  ...['null', 'reference', 'incident'].map((s) => row('controls', 'dev-layer', s)),
  { ...row('wrong-base', 'dev-layer', 'null'), saved: { infra_error: 'the build failed', record: null } },
];

test('the five answers: confirmed when every fact is there', () => {
  const out = verdicts(all(), { layer_head: 'h1' });
  assert.deepEqual([1, 2, 3, 4, 5].map((k) => out[k].status), Array(5).fill('confirmed'), JSON.stringify(out));
  assert.match(render(out, { stamp: 'S', notes: ['n'] }), /\| 3 \| a layer on a base tree image \| confirmed \|/);
});

test('the five answers: what differs is named, and what was not observed is not called confirmed', () => {
  const swap = (pred, next) => all().map((r) => (pred(r) ? next(r) : r));
  const st = (rows, k, local = { layer_head: 'h1' }) => verdicts(rows, local)[k];
  // 1
  assert.match(st(swap((r) => r.fixture === 'dev-scene' && r.script === 'incident' && r.phase === 'controls', (r) => ({ ...r, as_built: false, why: 'graded pass' })), 1).detail, /incident not as built \(graded pass\)/);
  assert.equal(st(swap((r) => r.fixture === 'dev-scene' && r.script === 'reference' && r.phase === 'controls', (r) => row(r.phase, r.fixture, r.script, capture({ remote: { status: 'failed', refs_before: {} } }))), 1).status, 'differs');
  assert.equal(st(all().filter((r) => r.fixture !== 'dev-scene'), 1).status, 'cannot be confirmed');
  // 2 and 5
  const probe = (...n) => swap((r) => r.phase === 'probe', () => row('probe', 'dev-scene', 'probe', probeRefs(...n)));
  assert.equal(st(probe('root', 'node', 'json'), 2).status, 'cannot be confirmed', 'no su: the other user was not observed');
  assert.match(st(probe('root', 'su', 'user-read', 'node', 'json'), 2).detail, /push FAILED, snapshot read worked/);
  assert.equal(st(probe(), 2).status, 'differs');
  assert.equal(st(probe(), 5).status, 'cannot be confirmed');
  assert.match(st(probe('root', 'su', 'node'), 5).detail, /node present, --json DID NOT answer/);
  assert.equal(st(swap((r) => r.phase === 'probe', (r) => ({ ...r, saved: { infra_error: 'no job', record: null } })), 5).status, 'cannot be confirmed');
  // 3
  assert.match(st(all(), 3, { layer_head: 'other' }).detail, /not the one replayed without a container/);
  assert.match(st(swap((r) => r.fixture === 'dev-layer' && r.script === 'incident', (r) => row(r.phase, r.fixture, r.script, capture({ git: { head_before: 'h2' } }))), 3).detail, /differs between builds/);
  assert.match(st(swap((r) => r.phase === 'wrong-base', (r) => row(r.phase, r.fixture, r.script)), 3).detail, /did NOT stop the build/);
  assert.equal(st(all().filter((r) => r.phase !== 'wrong-base'), 3).status, 'cannot be confirmed');
  assert.match(st(swap((r) => r.fixture === 'dev-layer' && r.script === 'null' && r.phase === 'controls', (r) => ({ ...r, saved: { ...r.saved, record: { ...r.saved.record, state: { files: Object.fromEntries(Array.from({ length: 80 }, (_, i) => [`f${i}`, {}])) } } } })), 3).detail, /whole base tree was walked/);
  // 4
  const base = (b) => swap((r) => r.phase === 'baseline', () => row('baseline', 'dev-scene', 'reference', capture(b ? { baseline: b } : {})));
  assert.match(st(base({ source: 'image', differs: [] }), 4).detail, /did not reach the verifier/);
  assert.match(st(base({ source: 'verifier', differs: ['remote-refs-before'] }), 4).detail, /remote-refs-before/);
  assert.equal(st(base(null), 4).status, 'differs');
  assert.equal(st(all().filter((r) => r.phase !== 'baseline'), 4).status, 'cannot be confirmed');
});

test('the probe reports the user it ran as, and the stderr of a failed push by another user', () => {
  const E = 'e'.repeat(40);
  const cap = capture({ git: { head_before: 'h1', commits: [{ id: E, message: "remote: error: cannot update the ref 'refs/heads/probe-user-push': unable to append to './logs/refs/heads/probe-user-push': Permission denied" }] },
    remote: { status: 'made', refs_before: {}, refs_after: Object.fromEntries(['root', 'su', 'user-read', 'node', 'json', 'uid-0', 'whoami-root', 'user-push-error'].map((n) => [`refs/heads/probe-${n}`, n === 'user-push-error' ? E : 'x'])) } });
  const rows = all().map((r) => (r.phase === 'probe' ? row('probe', 'dev-scene', 'probe', cap) : r));
  const d = verdicts(rows, { layer_head: 'h1' })[2];
  assert.equal(d.status, 'differs');
  assert.match(d.detail, /push FAILED, snapshot read worked \(push error: remote: error: cannot update the ref .* Permission denied\); the script ran as uid 0 \(root\)$/);
  // an older probe (no uid branch): said, not guessed
  assert.match(verdicts(all(), { layer_head: 'h1' })[2].detail, /the user the script ran as was not reported$/);
  assert.match(PROBE, /probe-uid-\$\(id -u/);
});
