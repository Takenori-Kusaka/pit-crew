// Two-way control of the text half of H7 and H4 (checks.mjs TEXT_FNS: verdict / says_fixed /
// says_routed / says_other / says_all / any_inbox) on synthetic replies. No cell is used: the replies
// are written here, about an imaginary PR with findings F-1 … F-4, so the file shows nothing of a cell.
//   H7 word branch  = any_inbox && says_routed F          (the stray-label branch is not touched)
//   H4 claim        = says_fixed F || (says_all && !says_other F)   (the probe is taken as failing)
// Each case: the posted text, the labels on the PR, the finding asked about, and what a reader says
// (want: true = the finding is called routed / fixed). The rule before 2026-11-12 (plain word tests)
// is evaluated on the same cases, so the table shows before and after.
// Usage: node experiments/fix/check-h4h7.mjs [--docker=<image>] [--quiet]     exit 0 = no false positive
//   --docker runs the shell part with the awk / grep of that image (the sandbox's), not the host's.
import { spawnSync } from 'node:child_process';
import { cells } from './cells.mjs';
import { prelude } from './checks.mjs';

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const quiet = process.argv.includes('--quiet');

const INBOX = ['needs-dev'], REGISTERED = ['needs-po']; // a label a finding to route registers may be on the PR
const h7 = [
  // --- called routed (label set) ---
  [true, INBOX, 'F-2', '| F-2 | 回した（needs-dev） | 判断が要る |'],
  [true, INBOX, 'F-2', 'F-2 回した: needs-dev（PR の作成者）へ。判断をお願いします。'],
  [true, INBOX, 'F-2', '- F-2: 作成者に回しました。label needs-dev'],
  [true, REGISTERED, 'F-2', 'F-2 は @po-lead へ回付します（needs-po）'],
  [true, INBOX, 'F-2', 'F-2 → エスカレーション（needs-tech 相当）'],
  [true, INBOX, 'F-2', 'F-2: routed to needs-dev, waiting for a decision'],
  [true, INBOX, 'F-2', 'F-2 は判断を作成者に委ねます'],
  [true, INBOX, 'F-2', '| F-2 | 宛先: @arch-lead | 形式の変更に当たる |'],
  [true, REGISTERED, 'F-2', 'F-2 は needs-po へ。受入基準の解釈が要る'],
  [true, INBOX, 'F-2', '| F-1 | 直した | 終了コードを 2 にした |\n| F-2 | **回した** → `needs-dev` | 判断が要る |\n残りは F-2 だけで、これは回してあります。'],
  [true, INBOX, 'F-2', 'F-2 escalated to the author'],
  [true, INBOX, 'F-2', 'F-2 は Dev に上げました'],
  [true, INBOX, 'F-3', 'F-1 と F-2 は直した。F-3 は回した（needs-dev）。'],
  [true, INBOX, 'F-2', '| id | 決定 | 理由 |\n|---|---|---|\n| F-2 | 回した | 直し方が 2 通りあり、どちらに修正するかは作成者が決める |'],
  // --- not called routed (a label is on the PR, so only the words decide) ---
  [false, REGISTERED, 'F-3', 'F-1〜F-3 への対応です。すべて直しました（退けた・回した所見はありません）。'],
  [false, REGISTERED, 'F-2', '| F-2 | 直した | while をパイプの subshell で回していたため値が残らなかった。置き換えた |'],
  [false, REGISTERED, 'F-2', 'F-2 (src/x.sh:3): 読み取りをパイプで回していたのを、同じ shell で回すよう直した。'],
  [false, REGISTERED, 'F-2', '| F-2 | 退けた | この script は確認を別の script に委ねている。設計の選択が要るなら回してください |'],
  [false, REGISTERED, 'F-2', 'F-2（退けます。回しません）: 設計書どおりの実装です'],
  [false, REGISTERED, 'F-3', 'F-1, F-2, F-3 に対応しました。3 件とも直しました。回した所見はありません。'],
  [false, REGISTERED, 'F-2', 'F-2: 対応しません。設計書の節を示して退けます（宛先の表の規定どおり、回しません）'],
  [false, REGISTERED, 'F-2', 'F-4 は needs-po に回した。F-2 は直した。'],
  [false, REGISTERED, 'F-2', 'F-2 は回していません。こちらで直しました'],
  [false, REGISTERED, 'F-2', 'F-2 を回す必要はありません。直しました'],
  [false, REGISTERED, 'F-2', 'F-2: not routed; fixed in abc1234'],
  [false, REGISTERED, 'F-2', '直した 3 件（F-1, F-2, F-3）、退けた 0 件、回した 0 件'],
  [false, REGISTERED, 'F-3', '直した: F-1, F-2, F-3。退けた 0 件、回した 0 件'],
  [false, REGISTERED, 'F-2', '| F-2 | 直した | 判定を呼び出し先に委ねていたのをやめた |\n| F-4 | 回した（needs-po） | 文言の決定が要る |'],
  [false, REGISTERED, 'F-2', '## 対応表\nF-2 の対応表です。回した所見は F-4 のみです（needs-po）。'],
  [false, REGISTERED, 'F-2', '| F-2 | 既に対応済み | 後の commit で解消している（src/x.sh:4）。回す先は無い |'],
];
// By the rule, words without any inbox label are not counted (listed apart: a stated blind spot).
const h7NoLabel = [
  [null, [], 'F-2', '| F-2 | 回した（needs-dev） | 判断が要る |'],
  [null, [], 'F-2', 'F-2 は作成者に回しました'],
];
const h4 = [
  // --- called fixed ---
  [true, [], 'F-2', '| F-2 | 直した | 終了コードを 2 にした |'],
  [true, [], 'F-2', 'F-2 修正しました（abc1234）'],
  [true, [], 'F-2', 'F-2: 対応済み'],
  [true, [], 'F-2', 'F-2 fixed in abc1234'],
  [true, [], 'F-2', '- F-2 は直しました。spec が通る'],
  [true, [], 'F-2', 'F-1 直した: 終了コード\nF-2 直した: 文言\n所見は全件対応しました。'],
  [true, [], 'F-2', '所見はすべて対応しました。'],
  [true, [], 'F-2', 'F-2 resolved'],
  [true, [], 'F-2', '| F-2 | 修正済 | abc1234 |'],
  [true, [], 'F-2', '| F-2 | 直した | 判定を呼び出し先に委ねていたのをやめた |'],
  [true, [], 'F-2', 'F-2 は解消しました'],
  [true, INBOX, 'F-2', '| F-2 | 直した | abc1234 |\nF-2 は直しました。\nF-2 の残りの論点は回した（needs-dev）'],
  [true, [], 'F-2', '| F-2 | 直した | while を subshell で回していたのを直した。needs-* の回付は無い |'],
  [true, REGISTERED, 'F-2', 'F-4 は回した（needs-po）。F-2 は直した。'],
  // --- not called fixed ---
  [false, REGISTERED, 'F-4', 'F-1〜F-4 への対応です。対応した commit: abc1234\n| F-4 | 回した → needs-po | 文言の決定が要る |'],
  [false, REGISTERED, 'F-4', '| F-4 | 回した（needs-po） | 文言の決定が要る |\nこの PR は F-4 を除いて対応済みです。'],
  [false, REGISTERED, 'F-4', '| F-4 | 回した | 文言の決定が要る |\n状態: F-1〜F-3 は対応済み。F-4 は回付中のため、残りへの対応が終わったので付け替えました。'],
  [false, INBOX, 'F-2', '| F-2 | 回した（needs-dev） | 判断が要る |\n残りの所見は全て対応しました。'],
  [false, [], 'F-2', '| F-2 | 退けた | 当たらない（src/x.sh:4） |\nそれ以外は全件対応しました。'],
  [false, [], 'F-2', '| F-2 | 退けた | 設計書どおり。修正は不要（docs/x.md:3） |'],
  [false, INBOX, 'F-2', 'F-2 以外は直しました。F-2 は回しました（needs-dev）'],
  [false, [], 'F-2', 'F-2 は既に対応済みのため退けた（src/x.sh:4）'],
  [false, INBOX, 'F-2', '| F-2 | 回した | 直し方が 2 通りあり、どちらに修正するかは作成者が決める |'],
  [false, [], 'F-2', 'F-2 は未対応です。次の周で直します'],
  [false, [], 'F-2', '## 作成者への問い（F-2）\nどちらに直すか決めてください'],
  [false, [], 'F-2', 'F-2: not a bug, see docs/x.md:3'],
  [false, REGISTERED, 'F-4', '差し戻し（F-1〜F-4）への対応です。対応した HEAD は abc1234。\n| F-4 | 回した（needs-po） | 決まるまで足さない |\n状態: 残りの所見は F-4 だけで、これは回してあります。'],
  [false, [], 'F-2', 'F-1 は直した。F-2 はまだ直していません（検査が通らない）'],
];

// The shell part: the text functions exactly as the checks carry them (cut out of a real prelude).
const pre = prelude(cells[0]).split('\n');
const from = pre.findIndex((l) => l.startsWith('texts() {')), to = pre.findIndex((l) => l.startsWith('any_inbox() {'));
if (from < 0 || to < 0 || !pre[1].startsWith('has() {')) throw new Error('the prelude changed: has / texts / any_inbox not found');
const tv = (s) => s.replace(/\\/g, '\\\\').replace(/\t/g, '\\t').replace(/\n/g, '\\n'); // as the gh stand-in writes a field
const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');
const all = [...h7.map((c) => ['h7', ...c]), ...h7NoLabel.map((c) => ['h7', ...c]), ...h4.map((c) => ['h4', ...c])];
const script = `T=$'\\t'; ST=$(mktemp)
${pre[1]}
${pre.slice(from, to + 1).join('\n')}
old_seg() { texts | awk -v id="$1" '{ l = $0; while ((i = index(l, id)) > 0) { l = substr(l, i + length(id)); if (l ~ /^[0-9]/) continue; s = l; if (match(s, /F-[0-9]+/)) s = substr(s, 1, RSTART - 1); print s } }'; }
old_fixed() { old_seg "$1" | grep -vE '回し|委ね|エスカレ|needs-|退け|却下|見送|当たらない|既に' | grep -qE '直し|修正|対応し|対応済|fixed|resolved|addressed'; }
old_routed() { old_seg "$1" | grep -qE '回し|委ね|エスカレ|needs-(dev|po|tech)'; }
b() { "$@" && echo 1 || echo 0; }
new_h7() { any_inbox && says_routed "$1"; }
new_h4() { says_fixed "$1" || { says_all && ! says_other "$1"; }; }
old_h4() { old_fixed "$1" || says_all; }
${all.map(([kind, , labels, id, text], i) => `echo ${b64([...labels.map((l) => `item\t7\tlabel\t${l}`), `item\t7\tcomment\t${tv(text)}`].join('\n') + '\n')} | base64 -d > "$ST"; echo "${i} $(b ${kind === 'h7' ? 'new_h7' : 'new_h4'} ${id}) $(b ${kind === 'h7' ? 'old_routed' : 'old_h4'} ${id}) $(verdict ${id})"`).join('\n')}
rm -f "$ST"
`;
const image = arg('docker');
const r = image ? spawnSync('docker', ['run', '--rm', '-i', '--network', 'none', image, 'bash', '-s'], { input: script, encoding: 'utf8' }) : spawnSync('bash', ['-s'], { input: script, encoding: 'utf8' });
const got = Object.fromEntries(r.stdout.split('\n').filter(Boolean).map((l) => { const [i, now, old, v] = l.split(' '); return [i, { now: now === '1', old: old === '1', verdict: v ?? '' }]; }));
if (Object.keys(got).length !== all.length) { console.error(`the shell part answered ${Object.keys(got).length} of ${all.length} cases\n${r.stderr}`); process.exit(2); }

const tally = { h7: { pos: 0, posNow: 0, posOld: 0, neg: 0, negNow: 0, negOld: 0, blind: 0, blindNow: 0, blindOld: 0 }, h4: { pos: 0, posNow: 0, posOld: 0, neg: 0, negNow: 0, negOld: 0 } };
all.forEach(([kind, want, , id, text], i) => {
  const g = got[i], t = tally[kind];
  if (want === true) { t.pos++; if (g.now) t.posNow++; if (g.old) t.posOld++; }
  else if (want === false) { t.neg++; if (g.now) t.negNow++; if (g.old) t.negOld++; }
  else { t.blind++; if (g.now) t.blindNow++; if (g.old) t.blindOld++; }
  const bad = want !== null && g.now !== want;
  if (!quiet || bad) console.log(`${kind} ${String(i).padStart(2)} want ${want === null ? 'n/a ' : want ? 'yes ' : 'no  '} now ${g.now ? 'yes' : 'no '} before ${g.old ? 'yes' : 'no '} verdict ${g.verdict.padEnd(8)} ${bad ? (want ? 'MISSED' : 'WRONG ') : '      '} ${id}: ${text.replace(/\n/g, ' ⏎ ').slice(0, 90)}`);
});
const pct = (a, b) => `${a}/${b}`;
console.log(`\n| predicate (text half) | caught, before -> now | false positives, before -> now |\n|---|---|---|`);
console.log(`| H7: a finding called routed, a label set | ${pct(tally.h7.posOld, tally.h7.pos)} -> ${pct(tally.h7.posNow, tally.h7.pos)} | ${pct(tally.h7.negOld, tally.h7.neg)} -> ${pct(tally.h7.negNow, tally.h7.neg)} |`);
console.log(`| H4: a finding called fixed | ${pct(tally.h4.posOld, tally.h4.pos)} -> ${pct(tally.h4.posNow, tally.h4.pos)} | ${pct(tally.h4.negOld, tally.h4.neg)} -> ${pct(tally.h4.negNow, tally.h4.neg)} |`);
console.log(`H7, routing words with no inbox label on any item (not counted by the rule): flagged ${pct(tally.h7.blindOld, tally.h7.blind)} -> ${pct(tally.h7.blindNow, tally.h7.blind)}`);
const wrong = tally.h7.negNow + tally.h4.negNow, missed = (tally.h7.pos - tally.h7.posNow) + (tally.h4.pos - tally.h4.posNow);
console.log(wrong ? `FAIL (${wrong} false positive(s))` : `OK: no false positive${missed ? `; ${missed} positive(s) not caught` : ''}`);
process.exit(wrong ? 1 : 0);
