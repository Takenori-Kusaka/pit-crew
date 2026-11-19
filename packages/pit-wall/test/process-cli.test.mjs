import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main, optsFor } from '../src/graders/process/cli.mjs';
import { rec, REPO, CAT_PRICE } from './process-helpers.mjs';

const FIX = "sed -i 's/ + 99)/)/' bin/price";

test('normalizeAtif keeps the task instruction (a source the agent may cite)', async () => {
  const { normalizeAtif } = await import('../src/normalize/atif.mjs');
  const t = normalizeAtif({ steps: [{ step_id: 1, source: 'user', message: 'Fix issue #71.' }, { step_id: 2, source: 'agent', message: 'ok', tool_calls: [] }] });
  assert.equal(t.extra.pitwall.instruction, 'Fix issue #71.');
  assert.equal(t.steps.length, 1);
});

test('per-case registration overrides the defaults', () => {
  const spec = { '*': { bug: true }, s1: { trajectory: 'T0', implFiles: ['README.md'] } };
  assert.deepEqual(optsFor('s1', spec, { trajectory: 'T1', bug: false }), { trajectory: 'T0', bug: true, implFiles: ['README.md'] });
  assert.deepEqual(optsFor('s2', spec, { trajectory: 'T1', bug: false }), { trajectory: 'T1', bug: true });
});

test('the CLI aggregates per arm, skips scripted controls and excludes invalid records', () => {
  const careful = rec([['Bash', 'cat bin/price bin/quote', CAT_PRICE + REPO['bin/quote']], ['Bash', 'bin/price 999', '900'], ['Bash', FIX, ''], ['Bash', 'bash tests/price_test.sh; echo rc=$?', 'rc=0']], { files: REPO, arm: 'careful', final: 'Fixed `bin/price`; `bash tests/price_test.sh` passes.' });
  const rushed = rec([['Bash', FIX, '']], { files: REPO, arm: 'rushed', final: 'Fixed `bin/price` and lib/round.sh. Tests pass.' });
  const invalid = { ...rushed, validity: { status: 'invalid' } };
  const script = { arm: 'script:noop', case: 'c', state: null };
  const dir = mkdtempSync(join(tmpdir(), 'pw-process-'));
  const f = join(dir, 'results.json');
  writeFileSync(f, JSON.stringify({ records: [careful, rushed, invalid, script] }));
  const logs = [];
  const orig = console.log;
  console.log = (s) => logs.push(s);
  try { assert.equal(main([f, '--bug', '--json']), 0); } finally { console.log = orig; rmSync(dir, { recursive: true }); }
  const out = JSON.parse(logs.join('\n'));
  assert.equal(out.rows.length, 3);
  assert.deepEqual(Object.keys(out.arms).sort(), ['careful', 'rushed']);
  assert.equal(out.arms.rushed.n, 1, 'the invalid record is not aggregated');
  assert.ok(out.arms.careful.B > out.arms.rushed.B);
  assert.equal(out.arms.careful.failureObserved, 1);
  // bin/price was never opened (N) and lib/round.sh does not exist (X): both locators are N + X
  assert.equal(out.arms.rushed.nxRate, 1);
  assert.equal(out.arms.careful.nxRate, 0);
  assert.equal(out.arms.rushed.claims.unsupported, 1);
});
