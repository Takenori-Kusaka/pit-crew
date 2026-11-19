// Both directions for the deterministic structure reasoning (research-machine-only §4 step 3):
// a good structure fires nothing; each deterministic mutation fires exactly the inference it
// targets (discriminant validity).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seurat, grounded, pareto, coherence } from '../src/graders/process/judge/structure.mjs';

const good = () => ({
  decision: 'how to fix the rounding',
  options: [
    { id: 'A', text: 'fix the existing round helper', adopted: true, pros: ['one call site', 'matches the design doc'], cons: [{ text: 'changes callers too', rebuttal: 'the only caller is bin/quote and it wants the fix' }] },
    { id: 'B', text: 'add a new function and switch callers', adopted: false, pros: ['limits the blast radius'], cons: ['leaves a duplicate', 'two code paths to test'] },
  ],
  criteria: { names: ['correctness', 'size', 'duplication'], matrix: { A: { correctness: '+', size: '+', duplication: '+' }, B: { correctness: '+', size: '0', duplication: '-' } } },
});
const codes = (s) => seurat(s).map((f) => f.code).sort();

test('a good structure: no SEURAT finding, adopted option in the grounded extension, non-inferior -> coherent', () => {
  const c = coherence(good());
  assert.deepEqual(c.findings, []);
  assert.equal(c.grounded, 'in');
  assert.equal(c.pareto.nonInferior, true);
  assert.deepEqual(c.pareto.decisive, ['size', 'duplication']);
  assert.equal(c.coherent, true);
});

test('S1 / S2: removing the adopted pros fires S1 (and S2 when cons remain), nothing else', () => {
  const s = good(); s.options[0].pros = [];
  assert.deepEqual(codes(s), ['S1', 'S2']);
  const s2 = good(); s2.options[0].pros = []; s2.options[0].cons = [];
  assert.deepEqual(codes(s2), ['M10', 'S1']);
});

test('M10: removing every con of the adopted option fires M10 only', () => {
  const s = good(); s.options[0].cons = [];
  assert.deepEqual(codes(s), ['M10']);
});

test('M4: the same argument on two options fires M4 only; M3: for and against the same option fires M3 only', () => {
  const s = good(); s.options[1].pros.push('matches the design doc');
  assert.deepEqual(codes(s), ['M4']);
  const s2 = good(); s2.options[1].cons.push('limits the blast radius');
  assert.deepEqual(codes(s2), ['M3']);
});

test('M1: a rejected option with more unrebutted support than the adopted one fires M1 only', () => {
  const s = good(); s.options[1].pros.push('no migration', 'already reviewed'); s.options[1].cons = [];
  assert.deepEqual(codes(s), ['M1']);
});

test('grounded extension: an unrebutted con puts the adopted option out; a rebuttal brings it back', () => {
  const s = good(); s.options[0].cons = ['changes callers too'];
  assert.equal(grounded(s).adopted, 'out');
  assert.equal(grounded(good()).adopted, 'in');
  assert.equal(grounded(good()).options.B, 'out'); // B has unrebutted cons
});

test('pareto: a rejected row that is at least as good everywhere and better somewhere dominates', () => {
  const s = good(); s.criteria.matrix.B = { correctness: '+', size: '+', duplication: '+' }; s.criteria.matrix.A.size = '0';
  const p = pareto(s);
  assert.deepEqual(p.dominatedBy, ['B']); assert.equal(p.nonInferior, false);
  assert.equal(pareto({ ...good(), criteria: undefined }).applicable, false);
});

test('T0: no adopted option (or two) is reported and nothing else is inferred', () => {
  const s = good(); s.options[0].adopted = false;
  assert.deepEqual(codes(s), ['T0']);
  assert.equal(grounded(s).adopted, null);
});
