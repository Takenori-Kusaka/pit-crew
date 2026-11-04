// Admission (Harbor -n from free memory, PSI, CPU), the watchdog rule, and the runner's plan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { admit, parseMeminfo, parsePsi, shouldStop } from '../src/runners/admission.mjs';
import { concurrencyPlan } from '../src/runners/harbor.mjs';

const calm = parsePsi('some avg10=0.06 avg60=0.17 avg300=0.18 total=1\nfull avg10=0.06 avg60=0.17 avg300=0.18 total=1\n');
const host = (o) => ({ memTotalMiB: 11962, memAvailableMiB: 11163, winFreeMiB: null, psiMem: calm, psiCpu: calm, nproc: 8, ...o });

test('parsers read /proc formats', () => {
  assert.equal(parseMeminfo('MemTotal:       12249088 kB\nMemAvailable:   11431936 kB\n').MemAvailable, 11164);
  assert.equal(calm.full.avg10, 0.06);
});

test('plenty of memory: capped at 6', () => {
  const a = admit(host());
  assert.equal(a.n, 6);
  assert.equal(a.reason, 'cap');
});

test('CPU-bound: nproc 4 gives 2', () => assert.equal(admit(host({ nproc: 4 })).n, 2));

test('memory-bound: 3 GiB available gives 2 (reserve 2 GiB, 384 MiB per trial)', () => {
  const a = admit(host({ memTotalMiB: 8192, memAvailableMiB: 3072 }));
  assert.equal(a.n, 2);
  assert.equal(a.reason, 'memory');
});

test('below the reserve: not started', () => assert.equal(admit(host({ memAvailableMiB: 1500 })).n, 0));

test('Windows free memory bounds WSL: 3000 - 2048 kept for Windows = 952 MiB: 2 trials', () => assert.equal(admit(host({ winFreeMiB: 3000 })).n, 2));
test('this machine at rest (Windows free 4836): capped at 6, not refused', () => assert.equal(admit(host({ winFreeMiB: 4836 })).n, 6));
test('Windows almost full: not started', () => assert.equal(admit(host({ winFreeMiB: 2300 })).n, 0));

test('memory pressure: not started even with free memory', () => {
  const hot = parsePsi('some avg10=30 avg60=20 avg300=5 total=1\nfull avg10=2 avg60=1 avg300=0 total=1\n');
  assert.equal(admit(host({ psiMem: hot })).n, 0);
});

test('watchdog stops only after 3 bad samples in a row', () => {
  const ok = { memAvailableMiB: 9000, psiMem: calm }, bad = { memAvailableMiB: 1000, psiMem: calm };
  assert.equal(shouldStop([ok, bad, bad], 2048), false);
  assert.equal(shouldStop([bad, bad], 2048), false);
  assert.equal(shouldStop([bad, bad, bad], 2048), true);
  assert.equal(shouldStop([bad, ok, bad], 2048), false);
});

test('runner plan: default 3, fixed wins, admission from host, refusal throws', () => {
  assert.deepEqual(concurrencyPlan({ PITWALL_ADMISSION: '0' }), { n: 3, mode: 'default' });
  assert.equal(concurrencyPlan({ PITWALL_HARBOR_CONCURRENCY: '5', PITWALL_ADMISSION: '1' }).n, 5);
  const p = concurrencyPlan({}, host());
  assert.equal(p.mode, 'admission');
  assert.equal(p.n, 6);
  assert.equal(p.limitMiB, 1024);
  assert.throws(() => concurrencyPlan({ PITWALL_ADMISSION: '1' }, host({ memAvailableMiB: 1000 })), /not started/);
});

test('a refused start is retried after dropping the cache; other errors and the last refusal are thrown', async () => {
  const { admitWithRetry } = await import('../src/runners/harbor.mjs');
  let calls = 0, drops = 0, slept = 0;
  const flaky = () => { calls++; if (calls < 3) throw new Error('not started: not enough free memory'); return { n: 4, mode: 'admission' }; };
  const p = admitWithRetry({ PITWALL_ADMISSION_WAIT_MIN: '5' }, { plan: flaky, sleep: () => { slept++; }, drop: () => { drops++; } });
  assert.equal(p.n, 4);
  assert.equal(calls, 3); assert.equal(drops, 2); assert.equal(slept, 2);
  calls = 0;
  assert.throws(() => admitWithRetry({ PITWALL_ADMISSION_WAIT_MIN: '2' }, { plan: () => { calls++; throw new Error('not started: memory or CPU pressure'); }, sleep: () => {}, drop: () => {} }), /not started/);
  assert.equal(calls, 2);
  assert.throws(() => admitWithRetry({}, { plan: () => { throw new Error('boom'); }, sleep: () => {}, drop: () => {} }), /boom/);
});
