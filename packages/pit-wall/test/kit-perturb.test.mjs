// Planted-error self-test (goal 2, N4): for every role with a spec and a fixture, the grader passes the
// reference script and catches each planted error (an added forbidden act, a dropped required act, a
// swapped ordered pair). The last test checks the check itself: a spec whose detector is blind must fail it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { perturbAll, perturbRole } from '../src/kit/perturb.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const all = perturbAll(ROOT);

test('there are roles to check', () => assert.ok(Object.keys(all).length >= 7, Object.keys(all).join(', ')));

for (const [role, r] of Object.entries(all)) {
  test(`${role}: the reference script passes`, () => assert.equal(r.original.pass, true, JSON.stringify(r.original)));
  test(`${role}: every planted error can be planted and is caught`, () => {
    const bad = r.results.filter((x) => !x.plantable || !x.detected).map((x) => `${x.kind}:${x.target}${x.plantable ? ' missed' : ' not plantable'}`);
    assert.deepEqual(bad, []);
    for (const k of ['add-forbidden', 'drop-required']) assert.ok(r.results.some((x) => x.kind === k), `${role} has no ${k}`);
  });
}

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
