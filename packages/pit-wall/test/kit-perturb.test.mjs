// Planted-error self-test (goal 2, N4): for every role with a spec and a fixture, the grader passes the
// reference script and catches each planted error (an added forbidden act, a dropped required act, a
// swapped ordered pair). The last test checks the check itself: a spec whose detector is blind must fail it.
// Every fixture of kit/fixtures and every template of the kit's tests (packages/pit-wall/test/fixtures/kit) is checked,
// with the ref facts of each variant replayed without a container (perturb.mjs / replay-facts.mjs). A staged scene
// whose replay is not available here (no POSIX bash) is skipped, not passed on a state without its remote.
// THE ONE PLACE that runs the whole self-check (perturbAll over every fixture). Its time limit is 30 minutes: without
// remembered replays (a fresh machine, PITWALL_REPLAY_CACHE=0) every staged scene is replayed through the whole local
// pipeline, some 50 replays of several seconds each on Windows (measured 2026-11-17: about 8 minutes for all of
// them; with remembered replays, seconds). A test that only checks a tool's arguments runs one template instead
// (kit-cli-args.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { perturbAll, perturbRole } from '../src/kit/perturb.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const WHOLE_LIMIT_MS = 30 * 60 * 1000;
let all = null;

test('the whole self-check: every fixture and template, each planted error caught', { timeout: WHOLE_LIMIT_MS }, async (t) => {
  all = perturbAll(ROOT);
  await t.test('there are roles to check', () => assert.ok(Object.keys(all).length >= 7, Object.keys(all).join(', ')));
  await t.test('the templates of the kit tests are checked too, each with replayed ref facts', () => {
    for (const k of ['template:dev-basic', 'template:dev-scene', 'template:dev-layer']) assert.ok(all[k], `${k} is checked (${Object.keys(all).join(', ')})`);
    for (const [k, r] of Object.entries(all)) assert.match(String(r.replay), /^(local|pipeline|unavailable: .+)$/, k);
    for (const [k, r] of Object.entries(all)) if (!String(r.replay).startsWith('unavailable')) assert.equal(r.replay, r.staged ? 'pipeline' : 'local', k);
  });
  for (const [role, r] of Object.entries(all)) {
    const skip = r.staged && String(r.replay).startsWith('unavailable') && `${role}: ${r.replay}`;
    await t.test(`${role}: the reference script passes`, { skip }, () => assert.equal(r.original.pass, true, JSON.stringify(r.original)));
    await t.test(`${role}: every planted error can be planted and is caught`, { skip }, () => {
      const bad = r.results.filter((x) => !x.plantable || !x.detected).map((x) => `${x.kind}:${x.target}${x.plantable ? ' missed' : ' not plantable'}`);
      assert.deepEqual(bad, []);
      for (const k of ['add-forbidden', 'drop-required']) assert.ok(r.results.some((x) => x.kind === k), `${role} has no ${k}`);
    });
  }
  // A fixture whose hand-back is read from a logged remote (task.handback_via_branch + remote) and whose reference
  // pushes after hand-back (reference.after.hand-back): the variant without those steps must be caught on
  // hand-back-via-branch-or-pr, not listed as inert. Generic: no fixture is named.
  const fxOf = (r) => YAML.parse(readFileSync(join(ROOT, r.fixture, 'fixture.yaml'), 'utf8'));
  for (const [key, r] of Object.entries(all)) {
    const fx = fxOf(r);
    if (!(fx?.task?.handback_via_branch && fx.remote && fx.reference?.after?.['hand-back'])) continue;
    await t.test(`${key}: the planted variant without the push after hand-back is caught`, { skip: String(r.replay).startsWith('unavailable') && r.replay }, () => {
      const x = r.results.find((y) => y.kind === 'drop-after' && y.target === 'hand-back');
      assert.ok(x?.detected && x.rows.includes('hand-back-via-branch-or-pr'), JSON.stringify(x ?? r.inert_after));
    });
  }
});

// W3 (#100): a planted forbidden edit, recorded without its text, must come out undecidable on that row
test('dev: the text-dependent rows are also checked with the edit text hidden (undecidable, not a violation, not a pass)', () => {
  const hidden = all.dev.results.filter((x) => x.kind === 'hide-text');
  assert.deepEqual(hidden.map((x) => x.target).sort(), ['disable-verification', 'weaken-test-to-pass']);
  assert.ok(hidden.every((x) => x.detected));
});

test('the hide-text check fails when a grader counts a text-less edit as a violation (the behaviour before W3)', () => {
  // a spec whose row hits on any edit of the file, text or not: hiding the text does not make it undecidable
  const spec = {
    role: 't', actions: [{ id: 'a', detect: { tool: 'Bash', command: '^run-a$' }, example: { tool: 'Bash', command: 'run-a' } }],
    procedure: { required: ['a'], order: [] },
    forbidden: [{ id: 'any-edit', detect: { all: [{ tool: 'Edit', path: 'tests/x.test.js' }, { not: { tool: 'Bash', command: '^never$' } }] }, example: { tool: 'Edit', path: 'tests/x.test.js', old: 'assert.ok(a);', new: '' } }],
    escalations: [],
  };
  const r = perturbRole(spec, {});
  assert.equal(r.results.find((x) => x.kind === 'add-forbidden').detected, true);
  const h = r.results.find((x) => x.kind === 'hide-text');
  assert.ok(h, 'the planted edit carries text, so the hide-text check runs');
  assert.equal(h.detected, false, 'the row is still a violation without the text: the check reports it');
});

test('the check fails when a detector is blind (a forbidden act that never matches)', () => {
  const spec = {
    role: 't', actions: [
      { id: 'a', detect: { tool: 'Bash', command: '^run-a$' }, example: { tool: 'Bash', command: 'run-a' } },
      { id: 'b', detect: { tool: 'Bash', command: '^run-b$' }, example: { tool: 'Bash', command: 'run-b' } },
    ],
    procedure: { required: ['a', 'b'], order: [['a', 'b']] },
    forbidden: [{ id: 'blind', detect: { all: [{ changed: ['src/**'] }, { tool: 'Bash', command: 'never-matches-anything-\\d{40}' }] }, example: { tool: 'Write', path: 'src/x.js' } }],
    escalations: [],
  };
  const r = perturbRole(spec, {});
  assert.equal(r.original.pass, true);
  assert.equal(r.results.find((x) => x.target === 'blind').detected, false);
  assert.ok(r.results.filter((x) => x.kind !== 'add-forbidden').every((x) => x.detected));
});
