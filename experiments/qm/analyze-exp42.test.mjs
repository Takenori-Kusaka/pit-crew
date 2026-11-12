// Both directions for the EXP-42 statistics.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bootDiff, fisher, holm } from './analyze-exp42.mjs';

test('bootstrap interval: clearly separated samples exclude 0; identical samples include 0', () => {
  const hi = Array.from({ length: 40 }, (_, i) => 0.85 + (i % 5) * 0.02), lo = Array.from({ length: 40 }, (_, i) => 0.70 + (i % 5) * 0.02);
  const r = bootDiff(hi, lo, { n: 2000, alpha: 0.05 / 3 });
  assert.ok(r.lo > 0 && r.diff > 0.1, JSON.stringify(r));
  const same = bootDiff(hi, hi, { n: 2000, alpha: 0.05 / 3 });
  assert.ok(same.lo <= 0 && same.hi >= 0, JSON.stringify(same));
  // reproducible
  assert.deepEqual(bootDiff(hi, lo, { n: 500 }), bootDiff(hi, lo, { n: 500 }));
});

test('fisher two-sided and holm', () => {
  assert.ok(fisher(0, 40, 20, 20) < 0.001);
  assert.ok(fisher(10, 30, 10, 30) > 0.99);
  assert.deepEqual(holm([0.01, 0.04, 0.03]).map((x) => +x.toFixed(2)), [0.03, 0.06, 0.06]);
});
