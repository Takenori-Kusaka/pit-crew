// Both directions for the EXP-39 E1 detector: options compared before the implementation edit
// count; the same text after the edit does not; an explicit 自明 declaration counts; prose with
// no options and no declaration does not.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rec, REPO } from '../../packages/pit-wall/test/process-helpers.mjs';
import { e1 } from './analyze-exp39.mjs';

const OPTIONS = '## 案の比較\n\n- 案A: 既存の round 関数を直す。変更は 1 行で済むが、呼び出し元の挙動も変わる。\n- 案B: 新しい関数を足して呼び出し元を切り替える。影響範囲を限定できるが、重複が残る。\n\n推奨: 案A。理由は呼び出し元が 1 つで、挙動の変更が狙いどおりだから。\n';
const edit = ['Edit', { file_path: 'bin/price', old_string: 'x', new_string: 'y' }];
const notes = (text) => ['Write', { file_path: 'notes/T1.md', content: text }];

test('two options written before the implementation edit -> E1 (compared)', () => {
  const x = e1(rec([notes(OPTIONS), edit], { files: { ...REPO, 'notes/T1.md': OPTIONS } }));
  assert.equal(x.compared, true);
  assert.equal(x.e1, true);
});

test('the same options written only after the implementation edit -> not E1', () => {
  const x = e1(rec([edit, notes(OPTIONS)], { files: { ...REPO, 'notes/T1.md': OPTIONS } }));
  assert.equal(x.e1, false);
});

test('an explicit 自明 declaration before the edit -> E1 (obvious), not compared', () => {
  const t = '自明: 解は 1 つ。round の切り上げを切り捨てに変えるだけで、他の案は成り立たない。\n';
  const x = e1(rec([notes(t), edit], { files: { ...REPO, 'notes/T1.md': t } }));
  assert.equal(x.obvious, true);
  assert.equal(x.compared, false);
  assert.equal(x.e1, true);
});

test('prose with a plan but no options and no declaration -> not E1', () => {
  const t = '## 計画\n\nbin/price の round を直し、テストを足す。\n';
  const x = e1(rec([notes(t), edit], { files: { ...REPO, 'notes/T1.md': t } }));
  assert.equal(x.e1, false);
});
