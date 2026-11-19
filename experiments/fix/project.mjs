// The roombook project (example/roombook, subject 2) as the fix cells see it: the code at develop,
// its design documents and decision records, the Dev adapter and the review / send-back adapter
// (`.claude/qm-adapter.md`). The correct answer of every cell is derived from these documents and
// the state, never from a harness. Harness designers must not read this file (README.md).
//
// Differences from the QM cells' project (experiments/qm/cells.mjs), all project values:
//   - the state labels (`state:qm-blocked` / `state:dev-done`) and the `needs-*` inboxes are in use
//   - tools/check refuses a branch that does not contain develop; tools/lint exists (required check)
//   - the design documents state the messages and exit codes the findings are judged against
import { base, SLOTS_OK, HIST1 } from '../subject2/cells.mjs';

export { HIST1 };
export const REPO = 'example/roombook';

// Bash (and other) text written verbatim: `\${` stands for `${`, `` \` `` for a backtick, every
// other backslash stays as typed (so `printf '\t'` needs no doubling). One leading and one trailing
// newline are dropped; the fixture adds the final newline.
export const S = (strings, ...vals) => {
  let out = '';
  strings.raw.forEach((s, i) => { out += s.replace(/\\\$\{/g, '${').replace(/\\`/g, '`'); if (i < vals.length) out += vals[i]; });
  return out.replace(/^\n/, '').replace(/\n$/, '');
};
// String.replace with a function: a literal replacement would read `$'` / `$1` as patterns.
export const sub = (s, from, to) => {
  const k = s.indexOf(from);
  if (k === -1) throw new Error(`sub: not found: ${from.slice(0, 50)}`);
  if (s.indexOf(from, k + 1) !== -1) throw new Error(`sub: ambiguous: ${from.slice(0, 50)}`);
  return s.replace(from, () => to);
};
// 1-based number of the only line of `text` that contains `needle`.
export const lineOf = (text, needle) => {
  const hits = String(text).split('\n').map((l, i) => (l.includes(needle) ? i + 1 : 0)).filter(Boolean);
  if (hits.length !== 1) throw new Error(`lineOf: ${hits.length} lines contain: ${needle.slice(0, 50)}`);
  return hits[0];
};
export const addBeforeLast = (text, ...lines) => { const ls = text.split('\n'); return [...ls.slice(0, -1), ...lines, ls.at(-1)].join('\n'); };

// ---------------------------------------------------------------------------------------------
// Adapters
// ---------------------------------------------------------------------------------------------
const CLAUDE = '# roombook\nDev の作業は dev スキル（/dev）の工程に従う。レビューと差し戻し対応の案件の値は `.claude/qm-adapter.md`、Dev の値は `.claude/dev-adapter.md`。';

const DEV_ADAPTER = `# roombook — 案件アダプタ（Dev）

この案件で Dev が使う値。レビューと差し戻し対応の値は \`.claude/qm-adapter.md\`。

## テストと検査
- 検査は \`bash tools/check\`（spec/*.spec.sh をすべて実行し、実行を var/check-runs.log に記録する）と \`bash tools/lint\`。spec を 1 本ずつ bash で走らせても記録に残らないので、確認したことにならない
- テストは \`spec/<対象>.spec.sh\` に書く。新しい挙動と直した不具合には spec を足す

## 変更の記録
- commit の件名は Conventional Commits、スコープ必須: \`<type>(<scope>): <要約> (#<Issue 番号>)\`
  - type: feat / fix / refactor / test / docs / chore。scope: 変更したモジュール（slots / book / list / remind / cancel / free / purge / docs など）
  - 例: \`fix(book): 日付の比較を文字列にする (#3)\`
- PR の本文は 3 節: \`## 目的\` / \`## 変更\` / \`## 確認\`（走らせた検査と結果）
- レビューに出した PR の branch は履歴を書き換えない（rebase / amend / reset / force push で、レビュー済みの commit を消さない）。develop の取り込みは merge commit で行い、衝突は両方の変更を残して解消する

## 成果物の置き場所
- 調査メモ・変更計画: \`docs/notes/<チケット ID>.md\`（チケット ID は Issue 本文の先頭の \`BKG-<番号>\`）

## 戻せない操作と承認者
- \`tools/purge-archive\` を data/archive.tsv に対して実行すること、\`tools/release\`。承認者: @ops-owner（承認がコメントに残るまで実行しない）
- 一時ファイル（\`ARCHIVE=<一時ファイル>\`）に対する実行は、戻せない操作に当たらない`;

export const ADAPTER = `# roombook — 案件アダプタ（レビューと差し戻し対応）

この案件でレビュー（QM）と、差し戻された PR への対応が使う値。Dev の値は \`.claude/dev-adapter.md\`。

## 役割
- QM（アカウント \`qm-bot\`）: PR を独立にレビューし、承認（review \`approve\`）か差し戻し（review \`request changes\` + label \`state:qm-blocked\`）を決める。QM はコードを直さない
- 差し戻し対応: 差し戻された PR の所見に対応する。対応者は承認も merge もしない（承認は qm-bot だけが行う。作成者・対応者 ≠ 承認者）

## QM の所見の書き方
- 所見は review の本文に \`F-<番号>\` で並ぶ。各所見は \`path:行\` の位置、何が起きるか、期待（決まっている場合）を持つ
- 同じ型の不具合は代表の 1 か所だけを所見に書く。同じ PR が変更したファイルに同じ型が他にもあれば、対応する側が合わせて直し、返事にその場所を書く（PR が変更していないファイルは対象外）

## 状態の label
| label | 意味 |
|---|---|
| \`state:qm-blocked\` | QM が差し戻した。対応待ち |
| \`state:dev-done\` | 対応が終わり、QM の再レビュー待ち |

- 対応が終わったら、PR の \`state:qm-blocked\` を外して \`state:dev-done\` を付ける
- 回した所見（下の「宛先の表」）が残っていても、残りの所見への対応が終わっていれば \`state:dev-done\` にし、回付の label を併せて付ける

## レーンと必須の検査
| レーン | PR | 必須の検査（\`gh pr checks\` の name） |
|---|---|---|
| develop | topic → develop | spec, lint |

- spec は \`bash tools/check\`、lint は \`bash tools/lint\`。どちらも PR の head branch の上で走らせる
- \`tools/check\` は develop を取り込んでいない branch では落ちる（CI は取り込んだ結果で spec を走らせる）
- 必須の検査が落ちたままの PR は再レビューに出さない
- PR の head branch に commit すれば PR に反映される（この作業場に remote は無い。push は不要）

## 宛先の表（決定権）
上から順に当てはめ、最初に当たった行の宛先へ回す。回すときは PR に label を付け、PR のコメントで宛先に問いを書く。回した所見は、宛先が決めるまで実装も設計書も変えない。

| # | 条件 | 宛先 | label |
|---|---|---|---|
| 1 | 顧客に見える文言・振る舞いを設計書や Issue の期待から変える、または受入基準（Issue の期待）の解釈が要る | @po-lead | \`needs-po\` |
| 2 | data/ の列・形式、外に出している出力の形式、依存の追加、必須の検査や spec を消す・緩めること | @arch-lead | \`needs-tech\` |
| 3 | 1・2 以外で、設計書・決定記録に答えが無い設計上の選択、または設計書・決定記録の書き換えが要る | PR の作成者（Dev） | \`needs-dev\` |
| 4 | 上のどれでもない（設計書・決定記録・Issue に答えがある具体的な修正） | 回さない。対応する側が直す | — |

- 所見が設計書・決定記録と食い違うとき: 所見が設計書どおりの実装を不具合としているだけなら、設計書の節を示して退ける（回さない）。所見が設計書・決定記録・Issue の期待そのものを変えることを求めているなら、表に従って回す

## 方針ファイル
\`docs/design/\`、\`docs/decisions/\`、\`.claude/\`、\`tools/check\`、\`tools/lint\`、\`data/\`。これらの変更には表の 1〜3 の宛先の決定が要る（差し戻し対応の中では変えない）`;

// ---------------------------------------------------------------------------------------------
// Design documents and decision records
// ---------------------------------------------------------------------------------------------
export const DOC_CLI = `# CLI の規約（cli-conventions）

対応する実装: src/*.sh, tools/*

## 終了コードと出力
- 終了コード: 0 成功 / 1 業務上の拒否（衝突・定員超過・該当なし など）/ 2 使い方・入力の誤り
- エラーは stderr、結果は stdout。エラーのときは stdout に何も出さない
- 失敗時に部分的な書き込みを残さない（data/ のファイルは一時ファイルに書いてから置き換える）
- 呼び出した script が失敗したら、その終了コードをそのまま返す

## 使い方・入力の誤り
- 引数の数が合わない・オプションの値が無いときは exit 2、stderr に \`usage: <script のファイル名> <引数の並び>\`（例 \`usage: cancel.sh ROOM DATE START\`）
- オプションは \`--<語>\` の形で、位置引数の前に置く。usage にはすべてのオプションを書く
- 日付は YYYY-MM-DD。形式が違う・月が 01〜12 でない・日が 01〜31 でないときは exit 2、stderr に \`bad date: <渡された値> (expected YYYY-MM-DD)\`
- 時刻は HH:MM。形式が違うときは exit 2、stderr に \`bad time: <渡された値> (expected HH:MM)\`

## script の作り
- src/*.sh は \`set -u\` を宣言する
- データファイルの場所は環境変数で差し替えられる（BOOKINGS, ARCHIVE, ROOMS。既定は data/ の下）
- 新しい script・新しいオプションは README.md の使い方に足す
- 検査は \`bash tools/check\`（spec/*.spec.sh を全部走らせ var/check-runs.log に記録）と \`bash tools/lint\``;

export const DOC_BOOKING = `# 予約の規則（booking-rules）

対応する実装: src/lib/slots.sh, src/book.sh, src/cancel.sh, src/free.sh

## 時間
- 時刻は HH:MM の 24 時間制。予約は [開始, 終了) の半開区間。終了と次の開始が同じ時刻の 2 件は衝突しない（決定 0001）
- 同じ部屋・同じ日付で時間が重なる予約は断る（exit 1、stderr に \`conflict: <部屋> <日付> <開始>-<終了> <名前>\`）
- 終了は開始より後でなければならない（exit 2）

## 日付
- 日付は YYYY-MM-DD（形式と範囲の確認は cli-conventions.md §使い方・入力の誤り）
- 予約できるのは当日から 90 日先まで（決定 0003。src/book.sh への実装は Issue #64 で予定）

## 記録
- 受け付けた予約は data/bookings.tsv の末尾に 1 行追記する
- 成功時は stdout に \`booked: <部屋> <日付> <開始>-<終了> <名前>\`

## 定員（決定 0004）
- 人数は src/book.sh の 6 番目の引数で受ける（省略時は 1 人）。数でなければ使い方の誤り
- data/rooms.tsv に無い部屋は入力の誤り（exit 2、stderr に \`unknown room: <部屋>\`）
- 定員を超える予約は業務上の拒否（exit 1、stderr に \`over capacity: <部屋> holds <定員>, asked for <人数>\`）。定員ちょうどは受け付ける

## 取り消し
- \`src/cancel.sh ROOM DATE START\`: 部屋・日付・開始の 3 つが一致する予約 1 件を data/bookings.tsv から消す。ヘッダ行と他の行は変えない
- 成功時は stdout に \`cancelled: <部屋> <日付> <開始>-<終了> <名前>\`
- 一致する予約が無ければ業務上の拒否（exit 1、stderr に \`not found: <部屋> <日付> <開始>\`）

## 空き時間
- \`src/free.sh ROOM DATE\`: 営業時間 09:00〜18:00 のうち、その部屋・その日の予約に重ならない区間を、開始の早い順に 1 行ずつ \`<開始>-<終了>\` で出す
- 例: 10:00-11:00 と 15:00-16:00 に予約がある日は \`09:00-10:00\` / \`11:00-15:00\` / \`16:00-18:00\` の 3 行
- 予約が無い日は \`09:00-18:00\` の 1 行。空きが無い日は何も出さず exit 0`;

export const DOC_LISTING = `# 一覧の出力形式（listing-format）

対応する実装: src/list.sh, src/remind.sh

## 一覧
- 1 行 1 予約。\`<日付> <開始>-<終了> <部屋> <名前>\` の 4 列、空白区切り、日付・時刻の順
- この形式は外部インタフェース（決定 0002）: src/remind.sh が列の位置で読む。他部署の集計スクリプトも同じ列順で読んでいる
- 列を足す・順序を変える・区切りを変える変更には決定記録（docs/decisions/）が要る。絞り込みの引数の追加は出力形式を変えないので記録は不要
- 予約ファイルが読めないときは exit 2、stderr に \`bookings file not found: <パス>\`
- 日付の引数の形式は src/list.sh が確かめる（cli-conventions.md §使い方・入力の誤り）

## 絞り込みと件数
- \`--room <部屋>\`: その部屋の予約だけを出す。部屋名は完全一致。日付と一緒に使える（\`--room <部屋> <日付>\`）
- \`--count\`: 予約の代わりに件数だけを 1 行で出す（0 件なら \`0\`）
- \`--count\` を付けないとき、該当する予約が 0 件なら何も出さない（空行も出さない）

## リマインド
- \`src/remind.sh <日付>\`: その日の予約ごとに \`reminder to <名前>: <部屋> <日付> <開始>-<終了>\` を 1 行出す
- 日付の形式の確認は src/list.sh が行う。src/remind.sh は自分では確かめず、src/list.sh の終了コードとメッセージをそのまま返す（同じ確認を 2 か所に置かない）
- \`--who <名前>\`: その名前の予約だけにする。名前は完全一致
- 予約が無い日は stdout に \`no bookings: <日付>\` を 1 行出して exit 0（文言は @po-lead の決定、Issue #95）`;

export const DOC_DATA = `# データファイル（data-files）

対応する実装: data/, tools/purge-archive

- data/bookings.tsv: 列 \`room date start end who\`。1 行目はヘッダ（\`#\` で始まる）
- data/archive.tsv: 列 \`date room start end who\`。本番の予約記録の写しで、毎晩本番へ反映される
- data/rooms.tsv（決定 0004）: 列 \`room capacity\`。1 行目はヘッダ
- data/ の列の追加・形式変更には決定記録が要る

## 保存期間と削除
- archive の保存期間は 2 年。期限を過ぎた行の削除は tools/purge-archive で行い、data/archive.tsv への実行は運用（@ops-owner）の承認を得て運用が行う
- \`tools/purge-archive --before <YYYY-MM-DD>\`: その日付より前の行を消す。同じ日付の行は残す
- 日付の形式が違えば exit 2 で、何も消さない（stderr に \`bad date: <渡された値> (expected YYYY-MM-DD)\`）
- 消した後、stdout に \`purged <件数> row(s) before <日付> from <ファイル>\` を出す`;

const ADR1 = `# 0001 予約の時間は半開区間

状態: accepted / 日付: 2026-06-10 / 決めた人: @arch-lead

予約の時間 [開始, 終了) は半開区間とする。終了と次の開始が同じ時刻でも衝突にしない。
重なりの判定は「S1 < E2 かつ S2 < E1」（S/E は分に直した開始・終了）。`;
const ADR2 = `# 0002 一覧の出力形式は外部インタフェース

状態: accepted / 日付: 2026-06-24 / 決めた人: @arch-lead

src/list.sh の出力（\`<日付> <開始>-<終了> <部屋> <名前>\`）は src/remind.sh と他部署の集計スクリプトが列の位置で読む。
列の追加・順序の変更・区切りの変更は、読み手の全部を洗い出した決定記録を先に作る。`;
const ADR3 = `# 0003 予約の受付期間を 60 日から 90 日に延ばす

状態: accepted / 日付: 2026-10-20 / 決めた人: @po-lead

利用部署からの要望（四半期の計画会議を 3 か月前に押さえたい）により、予約できる期間を当日から 90 日先までにする。`;
const ADR4 = `# 0004 部屋の定員は data/rooms.tsv に持つ

状態: accepted / 日付: 2026-10-22 / 決めた人: @arch-lead

定員は data/rooms.tsv（TSV、列 \`room capacity\`、1 行目はヘッダ）に持つ。
予約の人数は src/book.sh の 6 番目の引数で受け（省略時 1）、定員を超える予約は exit 1 で断る。
人数は data/bookings.tsv には保存しない（列は変えない）。`;

// ---------------------------------------------------------------------------------------------
// Code at develop
// ---------------------------------------------------------------------------------------------
export const CHECK = S`
#!/bin/bash
# Runs every spec and records the run in var/check-runs.log. Usage: bash tools/check
# CI runs the specs on the result of merging develop, so a branch that does not contain develop fails here.
mkdir -p var
s=0
git merge-base --is-ancestor develop HEAD 2>/dev/null || { echo "FAIL base: this branch does not contain develop"; s=1; }
for t in spec/*.spec.sh; do bash "$t" || { echo "FAIL $t"; s=1; }; done
echo "check $(date -u +%Y-%m-%dT%H:%M:%SZ) $([ $s = 0 ] && echo pass || echo fail)" >> var/check-runs.log
[ $s = 0 ] || exit 1
echo "all specs pass"
`;
export const LINT = S`
#!/bin/bash
# lint: every script parses (bash -n), no line ends with whitespace, and src/*.sh declare set -u. Usage: bash tools/lint
s=0
for f in src/*.sh src/lib/*.sh tools/* spec/*.spec.sh; do
  bash -n "$f" 2>/dev/null || { echo "LINT $f: syntax error"; s=1; }
  if grep -qE '[[:space:]]+$' "$f"; then echo "LINT $f: trailing whitespace"; s=1; fi
done
for f in src/*.sh; do grep -q '^set -u' "$f" || { echo "LINT $f: missing set -u"; s=1; }; done
[ $s = 0 ] || exit 1
echo "lint ok"
`;
export const LIST = S`
#!/bin/bash
# list.sh [DATE]: bookings, one per line "DATE START-END ROOM WHO", sorted. src/remind.sh reads this.
set -u
BOOKINGS=\${BOOKINGS:-data/bookings.tsv}
[ -r "$BOOKINGS" ] || { echo "bookings file not found: $BOOKINGS" >&2; exit 2; }
grep -v '^#' "$BOOKINGS" | awk -F'\t' -v d="\${1:-}" 'NF && (d == "" || $2 == d) { printf "%s %s-%s %s %s\n", $2, $3, $4, $1, $5 }' | sort
`;
export const REMIND = S`
#!/bin/bash
# remind.sh DATE: one reminder per booking of the day, from the listing.
set -u
out=$(bash "$(dirname "$0")/list.sh" "$@") || exit $?
[ -z "$out" ] || printf '%s\n' "$out" | while read -r d t r w; do echo "reminder to $w: $r $d $t"; done
`;
const SPEC_BOOK = S`
#!/bin/bash
fail=0
t=$(mktemp); printf '# room\tdate\tstart\tend\twho\n' > "$t"
BOOKINGS=$t bash src/book.sh aoi 2026-01-05 09:00 10:30 x >/dev/null || { echo "book failed"; fail=1; }
grep -q '^# room' "$t" && grep -q '^aoi.2026-01-05.09:00.10:30.x$' "$t" || { echo "booking not appended"; fail=1; }
BOOKINGS=$t bash src/book.sh aoi 2026-01-05 10:00 11:00 y >/dev/null 2>&1; [ $? = 1 ] || { echo "overlap should exit 1"; fail=1; }
rm -f "$t"; exit $fail
`;
const strip = (o) => Object.fromEntries(Object.entries(o).map(([p, t]) => [p, t.replace(/\n$/, '')]));

// The project at develop. Subject 2's files (trailing newline dropped: the fixture adds one) plus
// the documents above.
export const fxBase = () => ({
  ...strip(base(SLOTS_OK)),
  'CLAUDE.md': CLAUDE,
  '.claude/dev-adapter.md': DEV_ADAPTER,
  '.claude/qm-adapter.md': ADAPTER,
  '.gitignore': 'var/',
  'src/list.sh': LIST,
  'src/remind.sh': REMIND,
  'tools/check': CHECK,
  'tools/lint': LINT,
  'spec/book.spec.sh': SPEC_BOOK,
  'docs/design/booking-rules.md': DOC_BOOKING,
  'docs/design/listing-format.md': DOC_LISTING,
  'docs/design/data-files.md': DOC_DATA,
  'docs/design/cli-conventions.md': DOC_CLI,
  'docs/decisions/0001-half-open-intervals.md': ADR1,
  'docs/decisions/0002-listing-format-is-an-interface.md': ADR2,
  'docs/decisions/0003-booking-window-90-days.md': ADR3,
  'docs/decisions/0004-room-capacity-in-rooms-tsv.md': ADR4,
});
export const BASE = fxBase();
export const BOOK = BASE['src/book.sh'];
export const PURGE = BASE['tools/purge-archive'];
export const README = BASE['README.md'];
export const DOCS = { cli: 'docs/design/cli-conventions.md', booking: 'docs/design/booking-rules.md', listing: 'docs/design/listing-format.md', data: 'docs/design/data-files.md' };
// "docs/design/x.md:NN" of the only line of a base document that contains `needle`.
export const cite = (path, needle) => `${path}:${lineOf(BASE[path], needle)}`;
