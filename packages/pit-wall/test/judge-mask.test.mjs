// Masking and the third-edition reader measure (design 23 §13): deterministic parts with a fake Jev.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maskOptions, identifierTerms, maskedResidue, MASK } from '../src/graders/process/judge/mask.mjs';
import { measurePointJevV3 } from '../src/graders/process/judge/jev.mjs';

const OPTS = [{ text: 'reuse parse_date from lib/dates.sh' }, { text: 'parse the date inline in bin/report' }];
const OPTS_JA = [{ text: '既存の round を直す' }, { text: '新しい関数を足して切り替える' }];

test('identifierTerms: paths, snake_case, 4+ letter words; Japanese fragments between particles', () => {
  const t = identifierTerms(OPTS[0].text);
  for (const x of ['reuse parse_date from lib/dates.sh', 'parse_date', 'lib/dates.sh', 'reuse']) assert.ok(t.includes(x), x);
  assert.ok(!t.includes('from'));
  const j = identifierTerms(OPTS_JA[0].text);
  for (const x of ['既存', 'round', '直す']) assert.ok(j.includes(x), x);
});

test('maskOptions: every option\'s terms become one shared mask; adoption words go; runs collapse; other words stay', () => {
  const m = maskOptions('I chose to reuse parse_date from lib/dates.sh because bin/export already handles a bad date the same way; parsing inline would repeat it.', OPTS);
  assert.ok(!/parse_date|dates\.sh|reuse|inline/i.test(m), m);
  assert.ok(m.includes(MASK));
  // "date" is a term of option 2 ("parse the date inline"), so it is masked too; the observation's other words stay
  assert.ok(/bin\/export already handles a bad/.test(m), m);
  assert.ok(!/chose/.test(m), m);
  const j = maskOptions('既存の round を直す方針。呼び出し元が 1 つなので影響は小さい。', OPTS_JA);
  assert.ok(!/既存|round|直す/.test(j), j);
  assert.ok(/呼び出し元が 1 つ/.test(j), j);
  // a conclusion-only line leaves (almost) nothing
  const deg = 'reuse parse_date from lib/dates.sh.';
  assert.ok(maskedResidue(maskOptions(deg, OPTS), deg) < 0.15);
  const obs = 'bin/export already handles a bad date the same way';
  assert.ok(maskedResidue(maskOptions(obs, OPTS), obs) > 0.8);
});

test('measurePointJevV3: S = P_r − P_x, L1 = P_d − P_0 → k, L2 = P_x − P_0; shared P_0/P_d skip calls', async () => {
  process.env.TYPESAFE_API_KEY = 'test-key-not-real';
  let calls = 0;
  // Fake reader: the probability of the label whose option text contains "parse_date" is 0.9 when the
  // reasoning mentions "bin/export", 0.5 when it says nothing, 0.95 when it still contains the mask-escaped word.
  const fetchImpl = async (_u, init) => {
    calls++; const body = JSON.parse(init.body); const labels = body.questions.pick.choices; const reasoning = body.state.reasoning;
    const p = /bin\/export/.test(reasoning) ? 0.9 : /parse_date/.test(reasoning) ? 0.95 : 0.5;
    const probabilities = {}; for (const l of labels) { const line = body.state.options.find((o) => o.startsWith(`${l}:`)); probabilities[l] = /parse_date/.test(line) ? p : 1 - p; }
    return { ok: true, json: async () => ({ answers: { pick: { type: 'choice', choice: labels[0], probabilities } }, usage: { input_tokens: 10 } }) };
  };
  const base = { options: OPTS, adoptedIndex: 0, rationale: maskOptions('reuse parse_date: bin/export already handles a bad date', OPTS), controlRationale: maskOptions('Add a --since DATE option to bin/report.', OPTS), degenerate: maskOptions('reuse parse_date from lib/dates.sh.', OPTS) };
  const m = await measurePointJevV3(base, { k: 2, fetchImpl });
  assert.ok(Math.abs(m.P_r - 0.9) < 1e-9 && Math.abs(m.P_x - 0.5) < 1e-9 && Math.abs(m.P_0 - 0.5) < 1e-9 && Math.abs(m.P_d - 0.5) < 1e-9, JSON.stringify(m));
  assert.ok(Math.abs(m.S - 0.4) < 1e-9); assert.equal(m.k, 0); assert.ok(Math.abs(m.L2) < 1e-9);
  assert.equal(calls, 8);
  // unmasked degenerate leaks → k = 1
  const leak = await measurePointJevV3({ ...base, degenerate: 'reuse parse_date from lib/dates.sh.' }, { k: 2, fetchImpl });
  assert.equal(leak.k, 1);
  // shared P_0 / P_d: only P_r and P_x are called
  calls = 0;
  const again = await measurePointJevV3(base, { k: 2, fetchImpl, shared: m.shared });
  assert.equal(calls, 4); assert.equal(again.P_0, m.P_0);
  delete process.env.TYPESAFE_API_KEY;
});
