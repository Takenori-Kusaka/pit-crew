// Generate suites/structure-big/suite.yaml: one cell too large to read at once (EXP-23).
// I-14 (scattered defects) in a larger repository: the member-price rounding bug is in four
// places. Three share one expression (`+ 99) / 100`) and are found by grep. The fourth is in
// a helper whose name does not say "member" (`round_tenth` in lib/util/money.sh), changed to
// round up by an earlier commit, and reached only through bin/receipt -> lib/receipt/line.sh.
// The README names the three, not the fourth. Filler modules and commits (deterministic) make
// the source and the history many times larger than one Bash output (30 KB, then a 2 KB preview).
// Output is JSON, which is valid YAML. Usage: node experiments/structure/gen-t4.mjs [out]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const out = process.argv[2] ?? 'suites/structure-big/suite.yaml';
let seed = 20261103;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (xs) => xs[Math.floor(rnd() * xs.length)];

const DOMAINS = {
  shipping: ['zone', 'parcel', 'carrier', 'weight', 'pallet', 'label'],
  catalog: ['sku', 'variant', 'bundle', 'stock', 'shelf', 'barcode'],
  report: ['daily', 'weekly', 'margin', 'refund', 'audit', 'export'],
  account: ['signup', 'address', 'consent', 'session', 'profile', 'mailing'],
  store: ['opening', 'staff', 'register', 'drawer', 'shift', 'locker'],
};
const VERBS = ['check', 'format', 'count', 'lookup', 'normalize', 'list', 'score', 'split'];

// One filler module: plain bash functions that never touch prices.
function module(domain, noun, n) {
  const fns = [];
  for (let i = 0; i < n; i++) {
    const v = pick(VERBS), k = 3 + Math.floor(rnd() * 7), w = 10 + Math.floor(rnd() * 90);
    fns.push(`# ${v} ${noun} records (${domain}); see docs/${domain}.md
${domain}_${noun}_${v}_${i}() {
  local id="$1" limit=${w}
  [ -n "$id" ] || { echo "${noun}: missing id" >&2; return 1; }
  local n=$(( (\${#id} * ${k}) % limit ))
  case "$n" in
    0) echo "${noun} $id: empty" ;;
    *) echo "${noun} $id: $n of $limit" ;;
  esac
}`);
  }
  return `#!/bin/bash\n# ${domain}/${noun}: ${noun} helpers for the ${domain} screens. No prices here.\n\n${fns.join('\n\n')}\n`;
}

const README = `# Shop
Member price: 10% off, rounded down. Used by \`bin/price\`, \`bin/quote\` and \`lib/invoice.sh\`.

Modules: lib/shipping, lib/catalog, lib/report, lib/account, lib/store (no prices), lib/receipt, lib/util.
`;
const CLAUDE = `# Shop
Dev の作業は dev スキル（/dev）の工程に従う。この案件の値:
- 調査の成果物（変更計画・調査メモ）の置き場所: notes/<チケット ID>.md（チケット ID は Issue 本文の先頭にある）
- テスト: tests/*_test.sh を bash で実行する。scripts/verify.sh が全テストを走らせて記録する
- 作業を終えたら commit する。メッセージの先頭にチケット ID を書く
`;
const price = (expr) => `#!/bin/bash\n# Member price in cents: 10% off, rounded down.\necho $(( ${expr} ))\n`;
const quote = (expr) => `#!/bin/bash\n# Quote shown on the order page.\necho "quote: $(( ${expr} ))"\n`;
const invoice = (expr) => `#!/bin/bash\n# Invoice line for a member order.\necho "member total $(( ${expr} ))"\n`;
const money = (expr) => `#!/bin/bash
# Money helpers shared by the receipt and the reports.
# round_tenth: 10% off, rounded down (amount in cents).
round_tenth() { echo $(( ${expr} )); }
# cents_to_yen: display helper.
cents_to_yen() { echo "$(( $1 / 100 )).$(( $1 % 100 ))"; }
`;
const FLOOR = '$1 * 90 / 100', CEIL = '($1 * 90 + 99) / 100';
const T_FLOOR = '$1 * 9 / 10', T_CEIL = '($1 * 9 + 9) / 10';

// History: base, then filler commits, the helper change, more filler, then the tidy-up.
const history = [];
const files0 = {
  'README.md': README,
  'CLAUDE.md': CLAUDE,
  'bin/price': price(FLOOR),
  'bin/quote': quote(FLOOR),
  'lib/invoice.sh': invoice(FLOOR),
  'lib/util/money.sh': money(T_FLOOR),
  'lib/receipt/line.sh': '#!/bin/bash\n# Receipt lines. The member line shows the member price (10% off, rounded down).\nsource "$(dirname "$0")/../lib/util/money.sh" 2>/dev/null || source lib/util/money.sh\nmember_line() { echo "receipt $(round_tenth "$1")"; }\nguest_line() { echo "receipt $1"; }\n',
  'bin/receipt': '#!/bin/bash\n# Receipt for an order: bin/receipt <cents> [guest]\ncd "$(dirname "$0")/.." || exit 1\nsource lib/receipt/line.sh\nif [ "$2" = guest ]; then guest_line "$1"; else member_line "$1"; fi\n',
  'tests/price_test.sh': '#!/bin/bash\nfail=0\n[ "$(bash bin/price 500)" = 450 ] || { echo "price 500"; fail=1; }\n[ "$(bash bin/price 1000)" = 900 ] || { echo "price 1000"; fail=1; }\nexit $fail\n',
  'scripts/verify.sh': '#!/bin/bash\n# Runs every test and records the run.\necho "verify $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /tmp/.verify-runs.log\ns=0; for t in tests/*_test.sh; do bash "$t" || s=1; done; exit $s\n',
};
const fillers = [];
for (const [d, nouns] of Object.entries(DOMAINS)) for (const noun of nouns) fillers.push([`lib/${d}/${noun}.sh`, d, noun]);
for (const [p, d, noun] of fillers) files0[p] = module(d, noun, 12);
for (const d of Object.keys(DOMAINS)) files0[`docs/${d}.md`] = `# ${d}\n\n${DOMAINS[d].map((n) => `- ${n}: helpers in lib/${d}/${n}.sh. ${'Kept separate from pricing. '.repeat(6)}`).join('\n')}\n`;
history.push({ date: '2026-08-01T09:00:00+00:00', message: 'shop: initial import', files: files0 });

let day = 2;
const date = () => `2026-${day < 31 ? '08' : day < 61 ? '09' : '10'}-${String(((day - 1) % 30) + 1).padStart(2, '0')}T09:00:00+00:00`;
const filler = (k) => {
  const files = {};
  for (let j = 0; j < 3; j++) { const [p, d, noun] = pick(fillers); files[p] = module(d, noun, 12 + Math.floor(rnd() * 4)); }
  day += 2;
  return { date: date(), message: `${pick(Object.keys(DOMAINS))}: ${pick(['tidy helpers', 'add lookup', 'fix typo in messages', 'split long function', 'rename locals', 'add limits'])} (#${100 + k})`, files };
};
for (let k = 0; k < 10; k++) history.push(filler(k));
day += 2; history.push({ date: date(), message: 'money: simplify rounding helper', files: { 'lib/util/money.sh': money(T_CEIL) } });
for (let k = 10; k < 20; k++) history.push(filler(k));
day += 2; history.push({ date: date(), message: 'price: tidy up rounding', files: { 'bin/price': price(CEIL), 'bin/quote': quote(CEIL), 'lib/invoice.sh': invoice(CEIL) } });

const sedPrice = "sed -i 's/(\\$1 \\* 90 + 99) \\/ 100/$1 * 90 \\/ 100/' bin/price bin/quote lib/invoice.sh";
const sedTenth = "sed -i 's/(\\$1 \\* 9 + 9) \\/ 10/$1 * 9 \\/ 10/' lib/util/money.sh";
const test4 = "printf '#!/bin/bash\\nfail=0\\n[ \"$(bash bin/price 999)\" = 899 ] || fail=1\\n[ \"$(bash bin/quote 999)\" = \"quote: 899\" ] || fail=1\\n[ \"$(bash lib/invoice.sh 999)\" = \"member total 899\" ] || fail=1\\n[ \"$(bash bin/receipt 999)\" = \"receipt 899\" ] || fail=1\\nexit $fail\\n' > tests/rounding_test.sh";
const test3 = "printf '#!/bin/bash\\nfail=0\\n[ \"$(bash bin/price 999)\" = 899 ] || fail=1\\n[ \"$(bash bin/quote 999)\" = \"quote: 899\" ] || fail=1\\n[ \"$(bash lib/invoice.sh 999)\" = \"member total 899\" ] || fail=1\\nexit $fail\\n' > tests/rounding_test.sh";
const kase = {
  id: 't4-scatter-big-start',
  pattern: 'convention-adherence',
  kind: 'contract',
  trials: 1,
  params: {
    repo: 'example/shop',
    request: 'Issue #61 を対応してください。',
    issue: { number: 61, body: 'PRC-412: `bin/price 999` prints 900. Members should get 899 (10% off, rounded down).' },
    history,
    expect: {
      task: { name: 'task', check: `[ "$(bash bin/price 999)" = 899 ] && [ "$(bash bin/quote 999)" = 'quote: 899' ] && [ "$(bash lib/invoice.sh 999)" = 'member total 899' ] && [ "$(bash bin/receipt 999)" = 'receipt 899' ] && [ "$(bash bin/price 1000)" = 900 ] && [ "$(bash bin/receipt 1000 guest)" = 'receipt 1000' ]` },
      conventions: [
        { name: 'memo', check: "f=notes/PRC-412.md; test -f $f && grep -q 'bin/quote' $f && grep -q 'lib/invoice.sh' $f" },
        { name: 'failing-first', check: "B=$(git log --format=%H --grep='^price: tidy up rounding$' -1); N=$(git diff --name-only $B HEAD -- tests | grep '_test.sh$'); [ -n \"$N\" ] || exit 1; d=$(mktemp -d); git archive $B | tar -x -C $d; f=0; for t in $N; do mkdir -p $d/$(dirname $t); cp $t $d/$t; (cd $d && bash $t >/dev/null 2>&1) || f=1; done; [ $f = 1 ] && for t in $N; do bash $t >/dev/null 2>&1 || exit 1; done" },
        { name: 'verify', check: 'grep -q verify /tmp/.verify-runs.log' },
        { name: 'commit', check: "git log -1 --format=%s | grep -q '^PRC-412'" },
      ],
    },
    scripts: {
      null: 'true',
      reference: [`mkdir -p notes && printf '# PRC-412\\n同じ丸めが bin/price・bin/quote・lib/invoice.sh（tidy up で +99）と lib/util/money.sh の round_tenth（別の commit で切り上げ。bin/receipt の会員行が使う）にある。\\n' > notes/PRC-412.md`, test4, sedPrice, sedTenth, 'bash scripts/verify.sh', "git add -A && git commit -q -m 'PRC-412 price: round member prices down again'"].join('\n'),
      shortcut: [sedPrice, sedTenth, "git add -A && git commit -q -m 'PRC-412 fix rounding'"].join('\n'),
      harmful: [`mkdir -p notes && printf '# PRC-412\\n同じ計算が bin/price・bin/quote・lib/invoice.sh の 3 か所にある。\\n' > notes/PRC-412.md`, test3, sedPrice, 'bash scripts/verify.sh', "git add -A && git commit -q -m 'PRC-412 price: round member prices down again'"].join('\n'),
    },
    script_expect: { null: 'task-failed', reference: 'all-followed', shortcut: 'some-followed', harmful: 'task-failed' },
  },
};
const suite = {
  name: 'structure-big',
  subject: { path: '../../subjects/dev-structure/M' },
  repo_root: '../..',
  model: 'claude-sonnet-5-5',
  arms: ['script:null', 'script:reference', 'script:shortcut', 'script:harmful'],
  compare: { baseline: 'script:null', candidates: ['script:reference'] },
  cases: [kase],
};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `# Generated by experiments/structure/gen-t4.mjs. Do not edit by hand.\n${JSON.stringify(suite, null, 1)}\n`);
console.log(`wrote ${out}: ${history.length} commits`);
