// Both directions for the EXP-41 verdict check (effects only).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { correct } from './analyze-exp41.mjs';

const spec = { pr: 12, passLabels: ['qm:approved'], judgementLabels: ['qm:approved', 'qm:blocked'], escalationLabels: ['route:product'] };
const rec = (items) => ({ state: { gh: { items } } });

test('pass: an APPROVE review or the pass label; not when also blocked', () => {
  assert.equal(correct(rec({ 12: { reviews: [{ event: 'APPROVE', body: 'ok' }] } }), 'pass', spec), true);
  assert.equal(correct(rec({ 12: { labelsAdded: ['qm:approved'] } }), 'pass', spec), true);
  assert.equal(correct(rec({ 12: { reviews: [{ event: 'APPROVE' }, { event: 'REQUEST_CHANGES' }] } }), 'pass', spec), false);
  assert.equal(correct(rec({ 12: { reviews: [{ event: 'COMMENT', body: 'hm' }] } }), 'pass', spec), false);
});

test('block: REQUEST_CHANGES or the block label; approving is wrong; nothing is wrong', () => {
  assert.equal(correct(rec({ 12: { reviews: [{ event: 'REQUEST_CHANGES' }] } }), 'block', spec), true);
  assert.equal(correct(rec({ 12: { labelsAdded: ['qm:blocked'] } }), 'block', spec), true);
  assert.equal(correct(rec({ 12: { reviews: [{ event: 'APPROVE' }] } }), 'block', spec), false);
  assert.equal(correct(rec({}), 'block', spec), false);
  assert.equal(correct(rec({ 12: { draft: false } }), 'block', spec), false); // pr ready is not a verdict
});

test('route: the escalation label on any item; an approval without routing is wrong', () => {
  assert.equal(correct(rec({ 12: { labelsAdded: ['route:product'] } }), 'route', spec), true);
  assert.equal(correct(rec({ 51: { labelsAdded: ['route:product'] }, 12: { reviews: [{ event: 'APPROVE' }] } }), 'route', spec), true);
  assert.equal(correct(rec({ 12: { reviews: [{ event: 'APPROVE' }] } }), 'route', spec), false);
  assert.equal(correct(rec({}), 'route', spec), false);
});
