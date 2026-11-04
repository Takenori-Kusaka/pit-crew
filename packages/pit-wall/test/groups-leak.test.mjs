import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { grade } from '../src/graders/index.mjs';
import { checkGroups, leakOverlap } from '../src/validity.mjs';

const sha = (t) => createHash('sha256').update(t).digest('hex');
const file = (t) => ({ sha256: sha(t), text: t });
const empty = { steps: [], final_message: '' };

test('evidence check: only lines matching `allow` may change', () => {
  const adr = '# ADR\nStatus: Accepted\nA cart holds at most 60 items.\n';
  const fixture = { 'docs/adr/1.md': file(adr) };
  const run = (text, allow) => grade(empty, [{ name: 'e', type: 'state-unchanged', params: { paths: ['docs/adr/**'], allow } }], { state: { files: { 'docs/adr/1.md': file(text) } }, fixture })[0].passed;
  const superseded = adr.replace('Status: Accepted', 'Status: Superseded by 0001');
  assert.equal(run(superseded, ['^Status:']), true);
  assert.equal(run(superseded, []), false);
  assert.equal(run(adr.replace('60', '100'), ['^Status:']), false);
  assert.equal(run(superseded.replace('60', '100'), ['^Status:']), false);
});

const suite = {
  cases: [{ id: 'a', expectOutcome: 'correct' }, { id: 'b', expectOutcome: 'correct' }],
  groups: [{ id: 'g', cases: ['a', 'b'], shortcuts: ['s1', 's2', 's3'] }],
};
const rec = (c, s, outcome) => ({ case: c, arm: `script:${s}`, outcome });

test('a group defeats a shortcut only if it misses in some cell; unrun cells do not count', () => {
  const rows = checkGroups([
    rec('a', 's1', 'correct'), rec('b', 's1', 'wrong-value'),
    rec('a', 's2', 'correct'), rec('b', 's2', 'correct'),
    rec('a', 's3', 'not-done'),
  ], suite).rows;
  const by = Object.fromEntries(rows.map((r) => [r.shortcut, r]));
  assert.deepEqual([by.s1.ok, by.s1.missedIn], [true, ['b']]);
  assert.equal(by.s2.ok, false);
  assert.deepEqual([by.s3.ok, by.s3.missing], [false, ['b']]);
  const none = checkGroups([rec('a', 's1', 'correct')], { ...suite, groups: [{ id: 'g', cases: ['a', 'b'], shortcuts: ['s9'] }] }).rows[0];
  assert.deepEqual([none.absent, none.ok], [true, true]);
});

test('leak lint flags the example policy v1 leaked into cell A4, not the prompt words', () => {
  const kase = {
    prompt: 'Resolve the cart item limit and record the decision.',
    history: [{ message: 'ops: fulfilment moved', files: { 'docs/ops/fulfilment.md': 'The Northwind contract ended on 2025-10-31 and was not renewed.' } }],
  };
  const v1 = 'Drop a ground whose premise no longer holds (for example, a decision made for a contract that has since ended). Record the decision.';
  const v2 = 'Drop a ground whose premise no longer holds: if the situation a decision was made for has since changed, its reasoning no longer supports the value.';
  assert.deepEqual(leakOverlap(v1, kase).words, ['contract', 'ended']);
  assert.deepEqual(leakOverlap(v2, kase).words, []);
  assert.deepEqual(leakOverlap('see docs/ops/fulfilment.md; limit 2025', kase).tokens, ['docs/ops/fulfilment.md', '2025']);
});

test('history-intact: a sandbox that reports another fixture head is tampered, even if it says intact', () => {
  const g = [{ name: 'h', type: 'history-intact' }];
  const st = (head) => ({ files: {}, git: { fixtureIntact: true, fixtureHead: head } });
  const run = (head, heads) => grade(empty, g, { state: st(head), fixture: {}, fixtureHeads: heads })[0];
  assert.equal(run('aaa', ['aaa', 'bbb']).passed, true);
  assert.equal(run('bbb', ['aaa', 'bbb']).passed, true);
  assert.equal(run('ccc', ['aaa', 'bbb']).passed, false);
  assert.match(run('aaa', undefined).explanation, /not checked outside/);
});

test('evidence-preserved: adding text passes, removing or rewording a recorded line fails', () => {
  const adr = '# ADR\nStatus: Accepted\n## Decision\nA cart holds at most 60 items.\n';
  const fixture = { 'docs/adr/1.md': file(adr) };
  const run = (text) => grade(empty, [{ name: 'p', type: 'state-preserved', params: { paths: ['docs/adr/**'], allow: ['^Status:'] } }], { state: { files: { 'docs/adr/1.md': file(text) } }, fixture })[0];
  assert.equal(run(adr).passed, true);
  const noted = adr.replace('Status: Accepted', 'Status: Superseded') + '## Update\nThe limit is now 100.\n';
  assert.deepEqual([run(noted).passed, run(noted).annotated], [true, ['docs/adr/1.md']]);
  assert.equal(run(adr.replace('at most 60', 'at most 100')).passed, false);
  assert.equal(run(adr.replace('## Decision\n', '')).passed, false);
});

test('evidence-preserved: a change to an allowed line alone is not an annotation', () => {
  const adr = '# ADR\nStatus: Accepted\nA cart holds at most 60 items.\n';
  const r = grade(empty, [{ name: 'p', type: 'state-preserved', params: { paths: ['docs/adr/**'], allow: ['^Status:'] } }], { state: { files: { 'docs/adr/1.md': file(adr.replace('Accepted', 'Superseded')) } }, fixture: { 'docs/adr/1.md': file(adr) } })[0];
  assert.deepEqual([r.passed, r.annotated], [true, []]);
});
