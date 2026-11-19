import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { blindView, japaneseShare, kappa, score, serve, shownDigest, translateItems } from '../src/calibrate/index.mjs';

const item = (id, judges) => ({ id, key: { arm: 'secret-arm' }, judges, view: { case: 'c', reply: 'r', actions: [] } });
const seen = (it, label) => ({ label, shown: shownDigest(it) });

test('the labeller never sees the arm or any judge verdict', () => {
  const v = blindView([item('c01', { haiku: true })])[0];
  assert.deepEqual(Object.keys(v).sort(), ['actions', 'case', 'id', 'ja', 'reply', 'shown']);
});

test('kappa: perfect, chance-level and opposite raters', () => {
  assert.equal(kappa([[true, true], [false, false]]), 1);
  assert.equal(kappa([[true, false], [false, true]]), -1);
  assert.ok(Math.abs(kappa([[true, true], [true, false], [false, true], [false, false]])) < 1e-9);
});

test('score separates false passes from false fails and skips unsure labels', () => {
  const items = [item('a', { j: true }), item('b', { j: true }), item('c', { j: false }), item('d', { j: true })];
  const [a, b, c, d] = items;
  const labels = { a: seen(a, 'pass'), b: seen(b, 'fail'), c: seen(c, 'fail'), d: seen(d, 'unsure') };
  const s = score(items, labels);
  const j = s.rows.find((r) => r.judge === 'j');
  assert.equal(j.n, 3);
  assert.deepEqual(j.falsePass, ['b']);
  assert.deepEqual(j.falseFail, []);
  assert.deepEqual(s.unsure, ['d']);
});

test('serve writes labels to the file in the set directory, and only for known items', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pitwall-cal-'));
  writeFileSync(join(dir, 'items.json'), JSON.stringify([item('c01', { j: true })]));
  const srv = serve(dir, { port: 0 });
  await new Promise((r) => srv.once('listening', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  try {
    const items = await (await fetch(`${base}/api/items`)).json();
    assert.equal(items[0].judges, undefined);
    const ok = await fetch(`${base}/api/labels/c01`, { method: 'PUT', body: JSON.stringify({ label: 'fail', note: 'n', shown: items[0].shown }) });
    assert.equal(ok.status, 200);
    const stale = await fetch(`${base}/api/labels/c01`, { method: 'PUT', body: JSON.stringify({ label: 'pass', shown: 'old' }) });
    assert.equal(stale.status, 409);
    assert.equal(ok.status, 200);
    assert.equal(JSON.parse(readFileSync(join(dir, 'labels.json'), 'utf8')).c01.label, 'fail');
    assert.equal((await fetch(`${base}/api/labels/zz`, { method: 'PUT', body: '{}' })).status, 404);
    assert.equal((await fetch(`${base}/api/labels/c01`, { method: 'PUT', body: JSON.stringify({ label: 'maybe', shown: items[0].shown }) })).status, 400);
  } finally { srv.close(); }
});

test('labels made on other material are stale and excluded from the score', () => {
  const it = item('a', { j: true });
  const s = score([it], { a: { label: 'fail' } });
  assert.deepEqual(s.stale, ['a']);
  assert.equal(s.rows[0].n, 0);
});

test('japaneseShare tells an untranslated reply from a translated one', () => {
  assert.ok(japaneseShare("I don't have a number to give you yet.") < 0.1);
  assert.ok(japaneseShare('まだ数値は決めていません。`docs/design/cart.md` を参照。') > 0.9);
});

test('translation: an untranslated reply is retried, a meaning error stays unverified', () => {
  const it = { id: 'x', view: { reply: "I haven't replied.", actions: [] } };
  let calls = 0;
  const english = (system, prompt, schema) => { calls++; return schema.properties.translation ? { translation: "I haven't replied." } : { faithful: true, problems: [] }; };
  const a = translateItems([it], { call: english })[0];
  assert.equal(a.ja.status, 'unverified');
  assert.equal(calls, 2);
  const flipped = (system, prompt, schema) => (schema.properties.translation ? { translation: '返信した。' } : { faithful: false, problems: ['negation flipped'] });
  const b = translateItems([it], { call: flipped })[0];
  assert.equal(b.ja.status, 'unverified');
  assert.deepEqual(b.ja.problems, ['negation flipped']);
  const good = (system, prompt, schema) => (schema.properties.translation ? { translation: 'まだ返信していません。' } : { faithful: true, problems: [] });
  assert.equal(translateItems([it], { call: good })[0].ja.status, 'verified');
});
