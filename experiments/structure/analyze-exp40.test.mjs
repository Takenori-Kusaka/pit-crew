// Both directions for the EXP-40 E2 detector.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rec, REPO } from '../../packages/pit-wall/test/process-helpers.mjs';
import { e2, classifyItem } from './analyze-exp40.mjs';

const edit = ['Edit', { file_path: 'bin/price', old_string: 'x', new_string: 'y' }];
const notes = (text) => ['Write', { file_path: 'notes/T1.md', content: text }];
const LIST = '## 判断の点\n\n- 直し方: 案A 既存の round を直す（1 行、呼び出し元の挙動も変わる）/ 案B 新しい関数を足して切り替える（影響を限定、重複が残る）。採用 A、理由は呼び出し元が 1 つ。\n- 外から見える名前: 自明と判断。既存の関数名を保つため、代替は成り立たない。\n';

test('a 判断の点 block with every item answered, before the edit -> E2', () => {
  const x = e2(rec([notes(LIST), edit], { files: { ...REPO, 'notes/T1.md': LIST } }));
  assert.equal(x.e2, true);
  assert.deepEqual(x.classes, ['compared', 'obvious']);
});

test('the same block written only after the edit -> not E2', () => {
  const x = e2(rec([edit, notes(LIST)], { files: { ...REPO, 'notes/T1.md': LIST } }));
  assert.equal(x.e2, false);
});

test('a block with an unanswered item -> not E2 (list-unanswered)', () => {
  const t = '## 判断の点\n\n- 直し方: round を直す。\n- 名前: 自明。\n';
  const x = e2(rec([notes(t), edit], { files: { ...REPO, 'notes/T1.md': t } }));
  assert.equal(x.e2, false);
  assert.equal(x.kind, 'list-unanswered');
});

test('"判断の点: なし（理由）" -> E2 (none); without a reason -> not E2', () => {
  const ok = '判断の点: なし（1 行の定数の修正で、代替の直し方が無いため）\n';
  assert.equal(e2(rec([notes(ok), edit], { files: { ...REPO, 'notes/T1.md': ok } })).e2, true);
  const bad = '判断の点: なし\n';
  assert.equal(e2(rec([notes(bad), edit], { files: { ...REPO, 'notes/T1.md': bad } })).e2, false);
});

test('自明 in any wording counts when a reason follows; a bare 自明 does not', () => {
  assert.equal(classifyItem('名前: 自明です。既存の関数名を保つため'), 'obvious');
  assert.equal(classifyItem('名前: 自明。'), 'obvious-no-reason');
  assert.equal(classifyItem('直し方: Option A keep / Option B rewrite, chose A because smaller'), 'compared');
});

test('prose with no 判断の点 block -> not E2', () => {
  const t = '## 計画\n\n案A が良いと思うので round を直す。\n';
  assert.equal(e2(rec([notes(t), edit], { files: { ...REPO, 'notes/T1.md': t } })).e2, false);
});

test('a .gitignore write before the notes does not cut the window (post-hoc fix of the EXP-39/40 detector)', () => {
  const gi = ['Write', { file_path: '.gitignore', content: '.dev-state.md\n' }];
  const x = e2(rec([gi, notes(LIST), edit], { files: { ...REPO, '.gitignore': '.dev-state.md\n', 'notes/T1.md': LIST } }));
  assert.equal(x.e2, true);
});
