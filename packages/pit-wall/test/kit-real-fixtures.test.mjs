// What every REAL fixture of the kit (kit/fixtures/<name>) must satisfy — and nothing about its shape.
// A scene's author changes these fixtures (adds an incident, a passing script, a scene, an image line). This file
// must keep passing when they do, as long as the fixture is still well-formed: it pins no count, no scene id and no
// control name. The machinery itself is tested on the fixed templates of the tests (kit-templates.mjs).
// The last test guards the split: no other kit test may read kit/fixtures.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { harborCases, simulatedControls } from '../src/kit/harbor-cases.mjs';
import { ROOT, specPath } from './kit-templates.mjs';

const FX = join(ROOT, 'kit', 'fixtures');
const names = readdirSync(FX).filter((d) => existsSync(join(FX, d, 'fixture.yaml')));
const yamlOf = (d) => YAML.parse(readFileSync(join(FX, d, 'fixture.yaml'), 'utf8'));

test('there are real fixtures, and each names a role that has a spec', () => {
  assert.ok(names.length > 0);
  for (const d of names) assert.ok(existsSync(specPath(yamlOf(d).role)), `${d}: no kit/roles/${yamlOf(d).role}.yaml`);
});

for (const d of names) {
  test(`${d}: loads in today's format, and every scripted control is graded as built`, () => {
    const fx = yamlOf(d);
    // loading checks the format: a script filed under a key no case has, a bad name or expect, a step without
    // content, a reference.before on an unknown action — each is an error here
    const { spec, cases } = harborCases(specPath(fx.role), join(FX, d));
    assert.ok(cases.length > 0);
    for (const c of cases) {
      assert.match(c.id, /^[\w-]+$/);                                       // a directory and a Harbor task name
      assert.match(c.digest, /^[0-9a-f]{16}$/);
      assert.ok(typeof c.prompt === 'string' && c.prompt.length > 0);
      // what the fixture declares for every case reaches every case
      if (fx.handback) assert.ok(c.prompt.includes(fx.handback), `${c.id}: the request asks for the hand-back`);
      if (fx.scratch?.length) assert.ok(typeof c.files['.gitignore'] === 'string', `${c.id}: the scratch place is ignored`);
      // every control: nothing (null), a script with its events, or a reason why it has none
      assert.deepEqual(c.controls.null.events, []);
      for (const [name, k] of Object.entries(c.controls)) {
        assert.ok(Array.isArray(k.events) ? typeof k.script === 'string' && typeof k.expect === 'string' : typeof k.unavailable === 'string', `${c.id} ${name}`);
        assert.equal(name in c.scripts, Array.isArray(k.events), `${c.id} ${name}: a control with events has its script`);
      }
    }
    // the self-check without a container: no control "not as built". ("not available" = only a container can
    // decide it; that is not a failure here.) A control that does nothing never passes.
    const rows = simulatedControls(spec, cases);
    assert.deepEqual(rows.filter((r) => r.ok === false), []);
    assert.ok(rows.filter((r) => r.control === 'null' && r.available).every((r) => r.outcome !== 'pass'));
    assert.equal(rows.length, cases.reduce((n, c) => n + Object.keys(c.controls).length, 0), 'every control of every case was judged or listed as not available');
  });
}

// (The planted-error check of a scene that pushes after hand-back is in kit-perturb.test.mjs, the one place that runs
// the whole self-check: running it again here took minutes without remembered replays.)

test('W0a: no real fixture keeps the test command that fails on newer Node', () => {
  for (const d of names) {
    const p = join(FX, d, 'files', 'package.json');
    if (existsSync(p)) assert.equal(JSON.parse(readFileSync(p, 'utf8')).scripts?.test, 'node --test', d);
  }
});

// The guard. A kit test that reads a real fixture by name pins that fixture's shape sooner or later (2026-11-15/16:
// three times a scene author's change broke such tests). Real fixtures are read here, by the planted-error self-test
// (through perturbAll, every fixture, no names) and through the real contract table (kit-release-gate.test.mjs reads
// the fixtures that table names).
test('no other kit test reads kit/fixtures: the machinery is tested on the templates', () => {
  const dir = join(ROOT, 'packages/pit-wall/test');
  const real = /kit\/fixtures|'kit',\s*'fixtures'/;
  const offenders = [];
  for (const f of readdirSync(dir).filter((x) => /^kit-.*\.mjs$/.test(x) && x !== 'kit-real-fixtures.test.mjs')) {
    readFileSync(join(dir, f), 'utf8').split('\n').forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '').replace(/test\/fixtures\/kit/g, '');
      if (real.test(code)) offenders.push(`${f}:${i + 1}`);
    });
  }
  assert.deepEqual(offenders, [], 'read a template (kit-templates.mjs) instead, or add a generic check to kit-real-fixtures.test.mjs');
});
