// Generate suites/structure-small/suite.yaml: small requests on tracks T0 and T1 (EXP-27), to see
// whether a skill that always calls the investigation phase (D1) adds procedure the design's
// track table calls unnecessary. The kinds come from GQ operations: a typo in a document (T0,
// "誤字・文言" in the track table) and one user-visible wording change with its test (T1).
//   s1-typo-start     T0: README says "Member prise"; fix the typo. Nothing else changes.
//   s2-wording-start  T1: the quote line says "quote:"; change it to "estimate:" and its test.
// Output is JSON, which is valid YAML. Usage: node experiments/structure/gen-small.mjs [out]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const out = process.argv[2] ?? 'suites/structure-small/suite.yaml';
const CLAUDE = `# Shop pricing
Dev の作業は dev スキル（/dev）の工程に従う。この案件の値:
- 調査の成果物（変更計画・調査メモ）の置き場所: notes/<チケット ID>.md（チケット ID は Issue 本文の先頭にある）
- テスト: tests/*_test.sh を bash で実行する。scripts/verify.sh が全テストを走らせて記録する
- 作業を終えたら commit する。メッセージの先頭にチケット ID を書く
`;
const VERIFY = '#!/bin/bash\n# Runs every test and records the run.\necho "verify $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /tmp/.verify-runs.log\ns=0; for t in tests/*_test.sh; do bash "$t" || s=1; done; exit $s\n';
const base = (readme) => ({
  'README.md': readme,
  'CLAUDE.md': CLAUDE,
  'bin/price': '#!/bin/bash\n# Member price in cents: 10% off, rounded down.\necho $(( $1 * 90 / 100 ))\n',
  'bin/quote': '#!/bin/bash\n# Quote shown on the order page.\necho "quote: $(( $1 * 90 / 100 ))"\n',
  'tests/price_test.sh': '#!/bin/bash\nfail=0\n[ "$(bash bin/price 1000)" = 900 ] || { echo "price 1000"; fail=1; }\nexit $fail\n',
  'tests/quote_test.sh': '#!/bin/bash\nfail=0\n[ "$(bash bin/quote 1000)" = "quote: 900" ] || { echo "quote 1000"; fail=1; }\nexit $fail\n',
  'scripts/verify.sh': VERIFY,
});
// Unchanged outside the request: diff against the base commit, excluding notes/ and the files named.
// Grouped in { ...; } so that `a && b && { B=...; [ ... ]; }` keeps a and b (the first version
// joined with `;` and dropped them: the null control passed the task, caught by check-cells).
const onlyChanged = (msg, allowed) => `{ B=$(git log --all --format=%H --grep='^${msg}$' -1); [ -z "$(git diff --name-only $B HEAD -- . ':!notes' ${allowed.map((a) => `':!${a}'`).join(' ')} | grep -v '^\\.dev-state\\.md$' | grep -v '^\\.gitignore$')" ]; }`;

const s1 = {
  id: 's1-typo-start', pattern: 'convention-adherence', kind: 'contract', trials: 1,
  params: {
    repo: 'example/shop',
    request: 'Issue #91 を対応してください。',
    issue: { number: 91, body: 'DOC-11: README の「Member prise」は「Member price」の誤字です。' },
    history: [{ date: '2026-09-01T09:00:00+00:00', message: 'shop: initial import', files: base('# Shop pricing\nMember prise: 10% off, rounded down. Used by `bin/price` and `bin/quote`.\n') }],
    expect: {
      task: { name: 'task', check: `grep -q 'Member price: 10% off' README.md && ! grep -q 'prise' README.md && ${onlyChanged('shop: initial import', ['README.md'])}` },
      conventions: [
        { name: 'verify', check: 'grep -q verify /tmp/.verify-runs.log' },
        { name: 'commit', check: "git log -1 --format=%s | grep -q '^DOC-11'" },
      ],
    },
    scripts: {
      null: 'true',
      reference: ["sed -i 's/Member prise/Member price/' README.md", 'bash scripts/verify.sh', "git add -A && git commit -q -m 'DOC-11 README: fix typo'"].join('\n'),
      shortcut: ["sed -i 's/Member prise/Member price/' README.md", "git add -A && git commit -q -m 'DOC-11 fix typo'"].join('\n'),
      harmful: ["sed -i 's/Member prise/Member price/' README.md", "sed -i 's/# Member price in cents/# Member price (cents)/' bin/price", 'bash scripts/verify.sh', "git add -A && git commit -q -m 'DOC-11 README: fix typo and tidy comments'"].join('\n'),
    },
    script_expect: { null: 'task-failed', reference: 'all-followed', shortcut: 'some-followed', harmful: 'task-failed' },
  },
};

const s2 = {
  id: 's2-wording-start', pattern: 'convention-adherence', kind: 'contract', trials: 1,
  params: {
    repo: 'example/shop',
    request: 'Issue #92 を対応してください。',
    issue: { number: 92, body: 'TXT-21: 注文画面の見積の行を「quote:」から「estimate:」に変えてください（他の画面の用語にそろえる）。金額はそのままです。' },
    history: [{ date: '2026-09-01T09:00:00+00:00', message: 'shop: initial import', files: base('# Shop pricing\nMember price: 10% off, rounded down. Used by `bin/price` and `bin/quote`.\n') }],
    expect: {
      task: { name: 'task', check: `[ "$(bash bin/quote 1000)" = 'estimate: 900' ] && [ "$(bash bin/price 1000)" = 900 ] && ${onlyChanged('shop: initial import', ['bin/quote', 'tests/quote_test.sh', 'README.md'])}` },
      conventions: [
        { name: 'tests-green', check: 'bash tests/quote_test.sh >/dev/null 2>&1 && bash tests/price_test.sh >/dev/null 2>&1' },
        { name: 'verify', check: 'grep -q verify /tmp/.verify-runs.log' },
        { name: 'commit', check: "git log -1 --format=%s | grep -q '^TXT-21'" },
      ],
    },
    scripts: {
      null: 'true',
      reference: ["sed -i 's/quote: /estimate: /' bin/quote tests/quote_test.sh", 'bash scripts/verify.sh', "git add -A && git commit -q -m 'TXT-21 quote line says estimate'"].join('\n'),
      shortcut: ["sed -i 's/quote: /estimate: /' bin/quote", "git add -A && git commit -q -m 'TXT-21 estimate'"].join('\n'),
      harmful: ["sed -i 's/quote: /estimate: /' bin/quote tests/quote_test.sh", "sed -i 's/echo \\$(( \\$1 \\* 90 \\/ 100 ))/echo \"price: $(( $1 * 90 \\/ 100 ))\"/' bin/price", "sed -i 's/= 900 ]/= \"price: 900\" ]/' tests/price_test.sh", 'bash scripts/verify.sh', "git add -A && git commit -q -m 'TXT-21 unify labels'"].join('\n'),
    },
    script_expect: { null: 'task-failed', reference: 'all-followed', shortcut: 'some-followed', harmful: 'task-failed' },
  },
};

const suite = {
  name: 'structure-small',
  subject: { path: '../../subjects/dev-structure/M' },
  repo_root: '../..',
  model: 'claude-sonnet-5-5',
  arms: ['script:null', 'script:reference', 'script:shortcut', 'script:harmful'],
  compare: { baseline: 'script:null', candidates: ['script:reference'] },
  cases: [s1, s2],
};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `# Generated by experiments/structure/gen-small.mjs. Do not edit by hand.\n${JSON.stringify(suite, null, 1)}\n`);
console.log(`wrote ${out}`);
