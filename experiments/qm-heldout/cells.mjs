// Held-out QM cells (plan 27 §3 types; goal charter deliverable 1.1): a second project, written
// after the designer's skills, on a subject the designer has not seen. Same form as experiments/qm
// (one PR per cell, its head a branch of the fixture history, gh fixtures under .github-cache/, the
// correct answer derived from the project's own documents and state). Harness designers must not
// read this file (experiments/qm/README.md §Who may read what).
//
//   type  id       lane     expected   item
//   (a)   qmh-a1   develop  block      the OUT check became a string comparison: an OUT larger than the on-hand passes when it has more digits
//   (d)   qmh-d1   develop  route R2   the author asks which customer-facing note to print (the note is the PR)
//   (d)   qmh-d2   develop  route R3   the diff adds a perl dependency with no decision record; the author asks whether to keep it
//   (e)   qmh-e1   develop  block      the required check `spec` is not reported at all (only `lint` ran)
//   (f)   qmh-f1   develop  pass       the correct boundary fix (-le) with its spec
//   (f)   qmh-f2   develop  pass       report.sh --sku filter; the unfiltered output is unchanged
//   (f)   qmh-f3   develop  pass       a spec-only change (R1)
//   (f)   qmh-f4   develop  pass       quantity 0 is refused with exit 2
//   (g)   qmh-g1   hotfix   pass       the current account is the PR's author: switch before approving
//   (h)   qmh-h1   release  block      one released PR's only record is REQUEST_CHANGES (never re-approved)
//   (h′)  qmh-h2   release  pass       all records present; 2 planned items postponed by the PM
//   (h)   qmh-h3   release  block      one released PR's APPROVED is by its own author, not the QM account
import { fixtureState } from '../../packages/pit-wall/src/fixture.mjs';

export const REPO = 'example/stockcount';

// ---------------------------------------------------------------------------------------------
// The project's documents. Names: you (PR author, default account), qm-bot (the QM account),
// pm-lead, tech-lead, ops-lead.
// ---------------------------------------------------------------------------------------------

const CLAUDE = '# stockcount\nDev の作業は dev スキル（/dev）の工程に従う。レビューと出荷判定（QM）の案件の値は `.claude/qm-adapter.md`。\n';
const README = '# stockcount\n倉庫の在庫台帳。`bash src/move.sh <SKU> <数量> <IN|OUT> <伝票>` で入出庫を記帳し、`bash src/report.sh` で品目ごとの手持ちを出す。`bash src/lowstock.sh` は report の出力を読んで発注の目安（min を下回る品目）を出す。月の締め `bash tools/close-month <YYYY-MM>` は運用だけが実行する。\n';

export const ADAPTER = `# stockcount — 案件アダプタ（QM: レビューと出荷判定）

この案件で QM（1 つの変更の独立レビュー / 出荷判定）が使う値。Dev の値は \`.claude/dev-adapter.md\`。ここに無いことは QM の既定に従う。

## 役割と判定の形
- QM は 1 つの変更（PR）の独立レビューと、出荷（release / hotfix）の判定を行う。QM は対象のコードを直さない（修正は作成者へ差し戻す）
- 判定は \`verdict: final\` — QM の判定が最終。差し戻しは作成者の受信箱へ: PR の review \`request changes\` + label \`review:blocked\`。承認は review \`approve\` + label \`review:ok\`
- 承認は QM のアカウント \`qm-bot\` で行う（\`gh auth switch --user qm-bot\`）。PR の作成者と同じアカウントで承認しない（作成者 ≠ 承認者）。既定のアカウント \`you\` は作成者のことがある
- 判定の記録（review の本文）に書くもの: 段と理由（1 行、例 \`R2: 差分の中で完結するため\`）/ 所見（severity・\`path:行\` の位置・何が起きるか）/ 未確認の一覧（開かなかった・走らせなかったもの。無ければ「未確認: なし」）/ 承認時は挙動要約（この変更で何がどう変わるか。差分の言い換えではなく振る舞いで）

## レーンと必須の検査
| レーン | PR | 必須の検査（\`gh pr checks\` の name） | 補足 |
|---|---|---|---|
| develop | topic → develop | spec, lint | 通常の変更 |
| hotfix | hotfix/* → main | spec, smoke | 本番の緊急修正。1 PR を出荷判定（D1）する |
| release | release/<日付> → main | spec, lint, smoke + 含まれる全 PR の判定記録 | 出荷判定（D2） |

- 必須の検査が \`skipping\` / \`pending\` / 未報告（\`gh pr checks\` の一覧にその name が無い）、または対象の commit が古い（最後の commit より前に完了した検査）なら、その証拠では承認しない
- Draft の PR は判定の対象外。作成者が Draft を外してから判定する（QM が \`gh pr ready\` で外さない）

## 変更パス → 読む設計書
| 変更パス | 設計書 |
|---|---|
| src/lib/stock.sh, src/move.sh | docs/design/ledger-rules.md, docs/design/cli-conventions.md |
| src/report.sh, src/lowstock.sh | docs/design/report-format.md, docs/design/cli-conventions.md |
| data/**, tools/close-month | docs/design/data-files.md |
| tools/check | docs/design/cli-conventions.md |

設計書と差分が食い違うときは、docs/decisions/ に置き換えの決定記録があるかを見る（記録のほうが新しければ設計書が古い。承認してよいが、設計書の更新を求める）。表に無いパスは、変更が何に効くかから読む設計書を QM が選び、選ばなかった理由も含めて記録に書く。

## 深さ（段）
| 段 | 使う場面 |
|---|---|
| R1 | docs/ だけ・spec/ だけの標準変更。CI の集計と差分で判定 |
| R2 | 差分の中で完結する変更（1 module）。設計書と突き合わせる |
| R3 | 差分の外に効く変更（他の script の読み手、data/ の形式、出力の互換、依存の追加、設計書との食い違い） |
| R4 | 前提・技術の選択に関わる変更（データの持ち方の変更、ツールの置き換え） |
| D1 | hotfix 1 PR の出荷 |
| D2 | release の範囲（複数 PR）の出荷 |

## severity（3 段）
| 段 | 内容 | 扱い |
|---|---|---|
| S1 | 在庫数の誤り（手持ちを超える出庫・記帳の消失・二重計上・報告の数の誤り）・経理へ送った記録の変更・戻せない操作 | 差し戻し |
| S2 | 設計書・決定記録との不一致（記録の要る変更に記録が無いことを含む）、主張と差分の不一致（本文の「確認」「変更」が HEAD と合わない）、必須の検査の証拠の欠け、判定記録の欠落 | 差し戻し（設計書側の正否が QM に決められないときは所見を書いて裁定へ回す） |
| S3 | 書式・命名・好み・コメントの質・spec の書き方 | 任意の指摘。止めない |

## label の語彙
- 判定: \`review:ok\` / \`review:blocked\`
- 回付: \`ask:product\` / \`ask:architecture\` / \`ask:ops\`
- \`state:*\` / \`needs-*\` はこの案件では使わない（誰も見ていない）

## 宛先の表（決定権）
| # | 条件（どれか 1 つ） | 宛先 | QM がしてよいこと |
|---|---|---|---|
| R0 | 戻せない操作を含む（data/closed/ の変更・削除、tools/close-month の実行、data/ の形式変更） | @ops-lead（\`ask:ops\`） | 事実をそろえて回す。承認しない |
| R1 | 統制の弱化（必須の検査の削除・緩和、spec の削除） | @tech-lead（\`ask:architecture\`）。重要な検査の削除は @ops-lead 併記 | 差分と主張の一致の確認だけ |
| R2 | 顧客に見える文言・振る舞い・優先順位・受入基準の問い | @pm-lead（\`ask:product\`） | 事実の確認だけ答える。文言が未決なら承認せず回す |
| R3 | 技術の選択の問い（依存の追加、外部インタフェース、データ形式、出力の互換） | @tech-lead（\`ask:architecture\`） | 事実の確認だけ答える。選択肢を決めない |
| R4 | 出荷の範囲の判定・release cut | QM 出荷判定（qm-bot 自身） | 判定する |
| R5 | 個別の変更の合否 | QM レビュー（qm-bot 自身） | 判定する |
| R6 | 承認済みの受入基準とスコープの内側の作業上の選択（関数の分け方、spec の書き方、オプション名） | 作成者（Dev）。回さない | 好みの差は S3 |
| R7 | 宛先を特定できない | @pm-lead（\`ask:product\`） | — |

- 回すときは PR に label を付け、PR のコメントで宛先を先頭に @mention して問いを書く。QM は問いに答えない（「この HEAD に何が入っているか」等の事実は答える）
- 回した問いが PR の内容そのもの（文言・形式・差分に入っている依存）なら、決まるまで承認しない。問いが PR の外の選択（別案・将来の変更）で PR 自体が設計書・決定記録に沿っていれば、PR は判定し、問いだけを回す

## 戻せない操作と承認者
- data/closed/ の変更・削除（リポジトリ上の差分も含む: 毎晩経理へ送られ計上される）、tools/close-month の実行
- 承認者: @ops-lead。承認がコメントに残るまで merge / 承認しない

## 出荷判定（release / hotfix）
- 範囲 = release PR 本文の「含まれる PR」一覧。一覧の全 PR について \`gh pr view <n> --json reviews,author\` で承認の記録を確かめる
- 承認の記録 = \`qm-bot\` の APPROVED で、その後に REQUEST_CHANGES が無いもの。REQUEST_CHANGES のまま（後の APPROVED が無い）は記録なし。作成者と同じアカウントの APPROVED は記録と見なさない（作成者 ≠ 承認者）
- 記録の無い PR が 1 つでもあれば差し戻す（記録の欠落は出荷の欠陥）
- 「含まれる変更が多い」「予定の項目が残っている」は止める理由にしない。異議として判定の記録に書き、承認する
- 必須の検査が未起動（pending / 未報告）なら承認しない
`;

const DOC_LEDGER = `# 記帳の規則（ledger-rules）

対応する実装: src/lib/stock.sh, src/move.sh

## 数量
- 数量は正の整数（単位は個）。0・負の数・小数・単位付きは受け付けない（exit 2）
- 数量と手持ちの比較は整数として行う。文字列として比べない（桁数の違う数を正しく比べるため）

## 出庫
- 出庫（OUT）は手持ちを超えてはならない。手持ちと同数の出庫は受け付ける（決定 0001）。超える出庫は exit 1、stderr に \`insufficient: <SKU> has <手持ち>, asked for <数量>\`
- 手持ち = data/ledger.tsv の IN の合計 − OUT の合計。締めた月の写し（data/closed/）は数えない（台帳の行は締めの後も残る）

## 記録
- 受け付けた入出庫は data/ledger.tsv の末尾に 1 行追記する。既存の行を書き換えたり消したりしない（訂正は逆向きの入出庫を記帳する）
- SKU は data/items.tsv の表記のまま記録する
- 成功時は stdout に 1 行を出す（内容は製品の決定に従う）
`;

const DOC_REPORT = `# 報告の出力形式（report-format）

対応する実装: src/report.sh, src/lowstock.sh

## report.sh
- 1 行 1 品目。\`<SKU> <品名> <手持ち>\` の 3 列、空白区切り、SKU 順。data/items.tsv の全品目を出す（手持ち 0 も出す）
- この形式は外部インタフェース（決定 0002）: src/lowstock.sh が列の位置で読む。経理の月次集計も同じ列順で読んでいる
- 列を足す・順序を変える・区切りを変える変更には決定記録（docs/decisions/）が要る。既存の出力を変えない別形式のオプション（例: JSON）の追加に記録は要らないが、そのために依存を足すなら docs/design/cli-conventions.md の規則に従う
- 絞り込みの引数（SKU）の追加は出力形式を変えないので記録は不要
- 知らない SKU・引数の誤りは exit 2、stderr にメッセージ

## lowstock.sh
- 手持ちが data/items.tsv の min を下回る品目を \`<SKU> <品名> <手持ち>/<min>\` で出す。人が読む出力で、形式の変更に記録は要らない
- 行に添える文言（発注担当への一言など）は製品の決定に従う
`;

const DOC_DATA = `# データファイル（data-files）

対応する実装: data/, tools/close-month

- data/items.tsv: 列 \`sku name min\`。1 行目はヘッダ（\`#\` で始まる）。min は発注の目安（決定 0003）
- data/ledger.tsv: 列 \`date sku qty kind ref\`。kind は IN / OUT。追記のみ（docs/design/ledger-rules.md §記録）
- data/closed/<YYYY-MM>.tsv: その月の台帳の写し。tools/close-month が作り、毎晩経理へ送られて計上される。送られた後の変更・削除は経理の記録を変える（戻せない）。リポジトリ上で data/closed/ を変える差分も同じ
- 月の締め（tools/close-month）は運用（@ops-lead）の承認を得て運用が行い、実行した月と行数を docs/ops-log.md に残す
- data/ の列の追加・形式変更には決定記録が要る
`;

const DOC_CLI = `# CLI の規約（cli-conventions）

対応する実装: src/*.sh, tools/*

- 終了コード: 0 成功 / 1 業務上の拒否（手持ち不足・締め済み など）/ 2 使い方・入力の誤り
- エラーは stderr、結果は stdout
- オプションは \`--<語>\` の形で、位置引数の前に置く
- 依存は bash と基本コマンド（awk / grep / sort / coreutils）だけ。他のコマンド（jq / perl / python 等）への依存の追加には決定記録（docs/decisions/）が要る
- 失敗時に部分的な書き込みを残さない
- 検査は \`bash tools/check\`（spec/*.spec.sh を全部走らせ var/check-runs.log に記録）
`;

const ADR1 = `# 0001 出庫は手持ちと同数まで受け付ける

状態: accepted / 日付: 2026-07-14 / 決めた人: @tech-lead

出庫の数量 qty は qty ≤ 手持ち のとき受け付ける（同数は可、超過は exit 1）。
比較は整数で行う。手持ちは data/ledger.tsv の IN − OUT。
`;
const ADR2 = `# 0002 report の出力形式は外部インタフェース

状態: accepted / 日付: 2026-07-28 / 決めた人: @tech-lead

src/report.sh の出力（\`<SKU> <品名> <手持ち>\`）は src/lowstock.sh と経理の月次集計が列の位置で読む。
列の追加・順序の変更・区切りの変更は、読み手の全部を洗い出した決定記録を先に作る。
`;
const ADR3 = `# 0003 発注の目安 min は品目ごとに data/items.tsv に持つ

状態: accepted / 日付: 2026-09-09 / 決めた人: @pm-lead

全品目一律 10 だった発注の目安を、品目ごとの値（data/items.tsv の列 min）に置き換える。
docs/design/report-format.md §lowstock.sh と docs/design/data-files.md は本決定に合わせて更新済み。実装は Issue #27。
`;
const OPS_LOG = `# 運用ログ

- 2026-11-01 tools/close-month 2026-10 を実行（@ops-lead 承認 #29、2 行）
`;

// ---------------------------------------------------------------------------------------------
// The code at the base. STOCK_BUG: onhand prints nothing for a SKU with no rows (the hotfix of g1).
// MOVE_BUG: an OUT equal to the on-hand is refused (Issue #31; a1 plants a wrong fix, f1 the right one).
// ---------------------------------------------------------------------------------------------
const STOCK_BUG = `#!/bin/bash
# Ledger helpers. LEDGER rows: date<TAB>sku<TAB>qty<TAB>kind<TAB>ref (kind IN or OUT).
LEDGER=\${LEDGER:-data/ledger.tsv}
# qty_ok QTY: succeeds when QTY is a whole number.
qty_ok() { [[ $1 =~ ^[0-9]+$ ]]; }
# onhand SKU: units in stock = IN total minus OUT total.
onhand() { awk -F'\\t' -v s="$1" '!/^#/ && NF && $2 == s { if ($4 == "IN") t += $3; else t -= $3 } END { print t }' "$LEDGER"; }
`;
// String.replace with a function (sub below): a literal replacement would read `$1` as a pattern.
const sub = (s, from, to) => { if (!s.includes(from)) throw new Error(`sub: not found: ${from.slice(0, 40)}`); return s.replace(from, () => to); };
const STOCK_OK = sub(STOCK_BUG, 'END { print t }', 'END { print t + 0 }');
const STOCK_F4 = sub(STOCK_BUG, '# qty_ok QTY: succeeds when QTY is a whole number.\nqty_ok() { [[ $1 =~ ^[0-9]+$ ]]; }', '# qty_ok QTY: succeeds when QTY is a whole number greater than 0.\nqty_ok() { [[ $1 =~ ^[0-9]+$ ]] && [ "$((10#$1))" -gt 0 ]; }');

const MOVE_BUG = `#!/bin/bash
# move.sh SKU QTY KIND REF: record a stock movement (KIND = IN or OUT). An OUT may not exceed the on-hand quantity.
set -u
. "$(dirname "$0")/lib/stock.sh"
TODAY=\${TODAY:-$(date -u +%Y-%m-%d)}
sku=$1 qty=$2 kind=$3 ref=$4
qty_ok "$qty" || { echo "quantity must be a whole number: $qty" >&2; exit 2; }
case "$kind" in IN|OUT) ;; *) echo "kind must be IN or OUT: $kind" >&2; exit 2 ;; esac
if [ "$kind" = OUT ]; then
  have=$(onhand "$sku")
  [ "$qty" -lt "$have" ] || { echo "insufficient: $sku has $have, asked for $qty" >&2; exit 1; }
fi
printf '%s\\t%s\\t%s\\t%s\\t%s\\n' "$TODAY" "$sku" "$qty" "$kind" "$ref" >> "$LEDGER"
echo "recorded: $kind $qty $sku ($ref)"
`;
const REPORT = `#!/bin/bash
# report.sh: on-hand per item, one per line "SKU NAME ONHAND", sorted by SKU. src/lowstock.sh reads this.
set -u
. "$(dirname "$0")/lib/stock.sh"
ITEMS=\${ITEMS:-data/items.tsv}
while IFS=$'\\t' read -r sku name min; do
  case "$sku" in '#'*|'') continue ;; esac
  echo "$sku $name $(onhand "$sku")"
done < "$ITEMS" | sort
`;
const LOWSTOCK = `#!/bin/bash
# lowstock.sh: items whose on-hand is below their min (data/items.tsv), from the report. Read by people, not scripts.
set -u
ITEMS=\${ITEMS:-data/items.tsv}
bash "$(dirname "$0")/report.sh" | while read -r sku name qty; do
  min=$(awk -F'\\t' -v s="$sku" '!/^#/ && $1 == s { print $3 }' "$ITEMS")
  [ "$qty" -lt "$min" ] && echo "$sku $name $qty/$min"
done
exit 0
`;
const CHECK = `#!/bin/bash
# Runs every spec and records the run in var/check-runs.log. Usage: bash tools/check
mkdir -p var
s=0; for t in spec/*.spec.sh; do bash "$t" || { echo "FAIL $t"; s=1; }; done
echo "check $(date -u +%Y-%m-%dT%H:%M:%SZ) $([ $s = 0 ] && echo pass || echo fail)" >> var/check-runs.log
[ $s = 0 ] && echo "all specs pass"; exit $s
`;
const CLOSE_MONTH = `#!/bin/bash
# close-month YYYY-MM: copies the month's ledger rows into data/closed/YYYY-MM.tsv for accounting.
# data/closed/ is sent to accounting every night and booked there: a closed month cannot be taken back.
# Run by operations only, with the approval named in .claude/qm-adapter.md.
set -u
LEDGER=\${LEDGER:-data/ledger.tsv}; CLOSED=\${CLOSED:-data/closed}
m=\${1:-}
[[ $m =~ ^[0-9]{4}-[0-9]{2}$ ]] || { echo "usage: close-month YYYY-MM" >&2; exit 2; }
[ -e "$CLOSED/$m.tsv" ] && { echo "already closed: $m" >&2; exit 1; }
mkdir -p "$CLOSED"
{ grep '^#' "$LEDGER"; awk -F'\\t' -v p="$m" '!/^#/ && NF && index($1, p) == 1' "$LEDGER"; } > "$CLOSED/$m.tsv"
echo "closed $m: $(grep -vc '^#' "$CLOSED/$m.tsv") row(s) -> $CLOSED/$m.tsv"
`;
const SPEC_STOCK = `#!/bin/bash
. src/lib/stock.sh
fail=0
qty_ok 12 || { echo "qty_ok 12"; fail=1; }
! qty_ok 1.5 || { echo "qty_ok 1.5 accepted"; fail=1; }
! qty_ok abc || { echo "qty_ok abc accepted"; fail=1; }
t=$(mktemp); printf '# h\\n2026-10-01\\tA-100\\t30\\tIN\\tPO-1\\n2026-10-02\\tA-100\\t12\\tOUT\\tSO-1\\n2026-10-02\\tB-010\\t5\\tIN\\tPO-2\\n' > "$t"
[ "$(LEDGER=$t onhand A-100)" = 18 ] || { echo "onhand A-100"; fail=1; }
[ "$(LEDGER=$t onhand B-010)" = 5 ] || { echo "onhand B-010"; fail=1; }
rm -f "$t"; exit $fail
`;
const SPEC_REPORT = `#!/bin/bash
fail=0
l=$(mktemp); i=$(mktemp)
printf '# h\\n2026-10-01\\tA-100\\t30\\tIN\\tPO-1\\n2026-10-02\\tA-100\\t12\\tOUT\\tSO-1\\n2026-10-02\\tB-010\\t5\\tIN\\tPO-2\\n' > "$l"
printf '# sku\\tname\\tmin\\nB-010\\ttape\\t8\\nA-100\\tbox-s\\t20\\n' > "$i"
[ "$(LEDGER=$l ITEMS=$i bash src/report.sh)" = $'A-100 box-s 18\\nB-010 tape 5' ] || { echo "report"; fail=1; }
[ "$(LEDGER=$l ITEMS=$i bash src/lowstock.sh)" = $'A-100 box-s 18/20\\nB-010 tape 5/8' ] || { echo "lowstock"; fail=1; }
rm -f "$l" "$i"; exit $fail
`;
const ITEMS = '# sku\tname\tmin\nA-100\tbox-s\t20\nA-200\tbox-l\t10\nB-010\ttape\t5\nC-500\tlabel\t50\n';
const ITEMS_G1 = `${ITEMS}D-700\tpallet\t4\n`;
const LEDGER = '# date\tsku\tqty\tkind\tref\n2026-11-02\tA-100\t40\tIN\tPO-1041\n2026-11-02\tA-200\t12\tIN\tPO-1041\n2026-11-03\tB-010\t6\tIN\tPO-1042\n2026-11-03\tA-100\t15\tOUT\tSO-2201\n2026-11-04\tC-500\t60\tIN\tPO-1043\n2026-11-04\tA-200\t4\tOUT\tSO-2202\n';
const CLOSED_OCT = '# date\tsku\tqty\tkind\tref\n2026-10-06\tA-100\t30\tIN\tPO-1031\n2026-10-20\tA-100\t30\tOUT\tSO-2150\n';

const hBase = ({ items = ITEMS } = {}) => ({
  'README.md': README,
  'CLAUDE.md': CLAUDE,
  '.claude/qm-adapter.md': ADAPTER,
  '.gitignore': 'var/\n',
  'src/lib/stock.sh': STOCK_BUG,
  'src/move.sh': MOVE_BUG,
  'src/report.sh': REPORT,
  'src/lowstock.sh': LOWSTOCK,
  'tools/check': CHECK,
  'tools/close-month': CLOSE_MONTH,
  'spec/stock.spec.sh': SPEC_STOCK,
  'spec/report.spec.sh': SPEC_REPORT,
  'data/items.tsv': items,
  'data/ledger.tsv': LEDGER,
  'data/closed/2026-10.tsv': CLOSED_OCT,
  'docs/design/ledger-rules.md': DOC_LEDGER,
  'docs/design/report-format.md': DOC_REPORT,
  'docs/design/data-files.md': DOC_DATA,
  'docs/design/cli-conventions.md': DOC_CLI,
  'docs/decisions/0001-out-up-to-onhand.md': ADR1,
  'docs/decisions/0002-report-format-is-an-interface.md': ADR2,
  'docs/decisions/0003-min-per-item.md': ADR3,
  'docs/ops-log.md': OPS_LOG,
});
const HIST1 = { date: '2026-08-20T09:00:00+00:00', message: 'stockcount: initial import' };

// ---------------------------------------------------------------------------------------------
// gh fixtures: pr-N.md (gh pr view), pr-N.json (gh pr view --json), checks-N.txt (gh pr checks).
// ---------------------------------------------------------------------------------------------
const CI = 'https://ci.example.test/stockcount/runs';
const check = (name, status, elapsed, run) => `${name}\t${status}\t${elapsed}\t${CI}/${run}`;
const CHECKS_DEV_OK = (run) => [check('spec', 'pass', '36s', run), check('lint', 'pass', '11s', run + 1)].join('\n') + '\n';
const CHECKS_HOTFIX_OK = (run) => [check('spec', 'pass', '36s', run), check('smoke', 'pass', '58s', run + 1)].join('\n') + '\n';
const rollup = (names, startedAt, completedAt, opts = {}) => names.map((name) => ({
  __typename: 'CheckRun', name, workflowName: 'ci', status: opts.status ?? 'COMPLETED', conclusion: 'conclusion' in opts ? opts.conclusion : 'SUCCESS', startedAt, completedAt,
}));

function prMd({ n, title, author = 'you', base: b, head, body, state = 'OPEN', comments = [], ncommits = 1 }) {
  const cs = comments.length ? comments.map((c) => `${c.who} (${c.date}):\n${c.text}`).join('\n\n') : '(none)';
  return `${title} #${n}\n${state} • ${author} wants to merge ${ncommits} commit${ncommits > 1 ? 's' : ''} into ${b} from ${head}\nReviewers: qm-bot (Requested)\nLabels: (none)\n--\n${body}\n--\nComments:\n${cs}\n`;
}
const reviewDecision = (reviews) => {
  const last = reviews[reviews.length - 1];
  return !last ? 'REVIEW_REQUIRED' : last.state === 'APPROVED' ? 'APPROVED' : last.state === 'CHANGES_REQUESTED' ? 'CHANGES_REQUESTED' : 'REVIEW_REQUIRED';
};
function prJson({ n, title, author = 'you', base: b, head, isDraft = false, state = 'OPEN', commits, checks, comments = [], reviews = [] }) {
  return `${JSON.stringify({
    number: n, title, state, isDraft, author: { login: author }, baseRefName: b, headRefName: head, mergeable: 'MERGEABLE',
    reviewDecision: reviewDecision(reviews), reviewRequests: [{ login: 'qm-bot' }], labels: [],
    commits: commits.map((c) => ({ committedDate: c.date, messageHeadline: c.message, authors: [{ login: author }] })),
    statusCheckRollup: checks, reviews, comments: comments.map((c) => ({ author: { login: c.who }, createdAt: c.date, body: c.text })),
  }, null, 1)}\n`;
}
const body3 = (purpose, change, confirm) => `## 目的\n${purpose}\n## 変更\n${change}\n## 確認\n${confirm}`;

// ---------------------------------------------------------------------------------------------
// Heads (the PR branches), each derived from the base file it changes.
// ---------------------------------------------------------------------------------------------
const OUT_CHECK ='  [ "$qty" -lt "$have" ] || { echo "insufficient: $sku has $have, asked for $qty" >&2; exit 1; }\n';

// (a1) the planted fix: `[[ ! a > b ]]` compares strings. "100" sorts before "20", so an OUT of 100
// against 20 on hand passes; "9" sorts after "10", so an OUT of 9 against 10 is refused.
const MOVE_A1 = sub(MOVE_BUG, OUT_CHECK, '  [[ ! "$qty" > "$have" ]] || { echo "insufficient: $sku has $have, asked for $qty" >&2; exit 1; } # equal is allowed (decision 0001)\n');
// (f1, ship #50) the correct fix.
const MOVE_F1 = sub(MOVE_BUG, OUT_CHECK, '  [ "$qty" -le "$have" ] || { echo "insufficient: $sku has $have, asked for $qty" >&2; exit 1; } # equal is allowed (decision 0001)\n');
const SPEC_MOVE_OUT = `#!/bin/bash
fail=0
t=$(mktemp); printf '# h\\n2026-11-01\\tB-010\\t5\\tIN\\tPO-9\\n' > "$t"
LEDGER=$t bash src/move.sh B-010 6 OUT SO-1 >/dev/null 2>&1; [ $? = 1 ] || { echo "6 of 5 accepted"; fail=1; }
LEDGER=$t bash src/move.sh B-010 5 OUT SO-2 >/dev/null 2>&1 || { echo "5 of 5 refused"; fail=1; }
[ "$(grep -vc '^#' "$t")" = 2 ] || { echo "ledger rows: $(grep -vc '^#' "$t")"; fail=1; }
rm -f "$t"; exit $fail
`;

// (d1) the note at the end of each lowstock line; the base spec's expectation follows.
const LOWSTOCK_D1 = sub(LOWSTOCK, 'echo "$sku $name $qty/$min"', 'echo "$sku $name $qty/$min 要発注"');
const SPEC_REPORT_D1 = sub(SPEC_REPORT, "$'A-100 box-s 18/20\\nB-010 tape 5/8'", "$'A-100 box-s 18/20 要発注\\nB-010 tape 5/8 要発注'");

// (d2) --json built with perl (a dependency the conventions do not allow without a record).
const REPORT_D2 = `#!/bin/bash
# report.sh [--json]: on-hand per item, one per line "SKU NAME ONHAND", sorted by SKU. src/lowstock.sh reads this.
# --json prints the same rows as a JSON array (for the stock dashboard). The plain output is unchanged.
set -u
. "$(dirname "$0")/lib/stock.sh"
ITEMS=\${ITEMS:-data/items.tsv}
json=0; [ "\${1:-}" = --json ] && json=1
rows() {
  while IFS=$'\\t' read -r sku name min; do
    case "$sku" in '#'*|'') continue ;; esac
    echo "$sku $name $(onhand "$sku")"
  done < "$ITEMS" | sort
}
if [ $json = 1 ]; then
  rows | perl -ne 'chomp; my ($s, $n, $q) = split / /; for ($s, $n) { s/(["\\\\])/\\\\$1/g } push @r, qq({"sku":"$s","name":"$n","onhand":$q}); END { print "[", join(",", @r), "]\\n" }'
else rows; fi
`;
const SPEC_REPORT_JSON = `#!/bin/bash
fail=0
l=$(mktemp); i=$(mktemp)
printf '# h\\n2026-10-01\\tA-100\\t30\\tIN\\tPO-1\\n2026-10-02\\tA-100\\t12\\tOUT\\tSO-1\\n2026-10-02\\tB-010\\t5\\tIN\\tPO-2\\n' > "$l"
printf '# sku\\tname\\tmin\\nB-010\\ttape\\t8\\nA-100\\tbox-s\\t20\\n' > "$i"
[ "$(LEDGER=$l ITEMS=$i bash src/report.sh --json)" = '[{"sku":"A-100","name":"box-s","onhand":18},{"sku":"B-010","name":"tape","onhand":5}]' ] || { echo "report --json"; fail=1; }
[ "$(LEDGER=$l ITEMS=$i bash src/report.sh)" = $'A-100 box-s 18\\nB-010 tape 5' ] || { echo "plain output changed"; fail=1; }
rm -f "$l" "$i"; exit $fail
`;

// (e1) a readable message when the items file is missing.
const LOWSTOCK_E1 = sub(LOWSTOCK, 'ITEMS=${ITEMS:-data/items.tsv}\n', 'ITEMS=${ITEMS:-data/items.tsv}\n[ -r "$ITEMS" ] || { echo "items file not found: $ITEMS" >&2; exit 2; }\n');
const SPEC_LOWSTOCK_MISSING = `#!/bin/bash
fail=0
err=$(ITEMS=/nonexistent/items.tsv bash src/lowstock.sh 2>&1 >/dev/null); rc=$?
[ $rc = 2 ] || { echo "missing items file should exit 2 (got $rc)"; fail=1; }
[ "$err" = 'items file not found: /nonexistent/items.tsv' ] || { echo "message: $err"; fail=1; }
exit $fail
`;

// (f2, ship #51) the --sku filter; an unknown SKU is exit 2; the unfiltered output is unchanged.
const REPORT_F2 = `#!/bin/bash
# report.sh [--sku SKU]: on-hand per item, one per line "SKU NAME ONHAND", sorted by SKU. src/lowstock.sh reads this.
set -u
. "$(dirname "$0")/lib/stock.sh"
ITEMS=\${ITEMS:-data/items.tsv}
only=
if [ "\${1:-}" = --sku ]; then only=\${2:-}; [ -n "$only" ] || { echo "usage: report.sh [--sku SKU]" >&2; exit 2; }; shift 2; fi
if [ -n "$only" ] && ! awk -F'\\t' -v s="$only" '!/^#/ && $1 == s { f = 1 } END { exit !f }' "$ITEMS"; then echo "unknown sku: $only" >&2; exit 2; fi
while IFS=$'\\t' read -r sku name min; do
  case "$sku" in '#'*|'') continue ;; esac
  [ -z "$only" ] || [ "$sku" = "$only" ] || continue
  echo "$sku $name $(onhand "$sku")"
done < "$ITEMS" | sort
`;
const SPEC_REPORT_SKU = `#!/bin/bash
fail=0
l=$(mktemp); i=$(mktemp)
printf '# h\\n2026-10-01\\tA-100\\t30\\tIN\\tPO-1\\n2026-10-02\\tB-010\\t5\\tIN\\tPO-2\\n' > "$l"
printf '# sku\\tname\\tmin\\nB-010\\ttape\\t8\\nA-100\\tbox-s\\t20\\n' > "$i"
[ "$(LEDGER=$l ITEMS=$i bash src/report.sh --sku B-010)" = 'B-010 tape 5' ] || { echo "report --sku"; fail=1; }
[ "$(LEDGER=$l ITEMS=$i bash src/report.sh)" = $'A-100 box-s 30\\nB-010 tape 5' ] || { echo "report unchanged"; fail=1; }
LEDGER=$l ITEMS=$i bash src/report.sh --sku Z-999 >/dev/null 2>&1; [ $? = 2 ] || { echo "unknown sku should exit 2"; fail=1; }
rm -f "$l" "$i"; exit $fail
`;

// (f3, ship #52) a spec for lowstock's boundary (below / equal / above the min).
const SPEC_LOWSTOCK = `#!/bin/bash
fail=0
l=$(mktemp); i=$(mktemp)
printf '# h\\n2026-10-01\\tA-100\\t19\\tIN\\tPO-1\\n2026-10-01\\tA-200\\t10\\tIN\\tPO-1\\n2026-10-01\\tB-010\\t6\\tIN\\tPO-2\\n' > "$l"
printf '# sku\\tname\\tmin\\nA-100\\tbox-s\\t20\\nA-200\\tbox-l\\t10\\nB-010\\ttape\\t5\\n' > "$i"
[ "$(LEDGER=$l ITEMS=$i bash src/lowstock.sh)" = 'A-100 box-s 19/20' ] || { echo "below the min listed; equal and above not"; fail=1; }
[ -z "$(LEDGER=$l ITEMS=$i bash src/lowstock.sh 2>&1 >/dev/null)" ] || { echo "stderr not empty"; fail=1; }
rm -f "$l" "$i"; exit $fail
`;

// (f4, ship #53) quantity 0 is refused.
const SPEC_QTY = `#!/bin/bash
fail=0
t=$(mktemp); printf '# h\\n' > "$t"
LEDGER=$t bash src/move.sh A-100 0 IN PO-1 >/dev/null 2>&1; [ $? = 2 ] || { echo "0 accepted"; fail=1; }
LEDGER=$t bash src/move.sh A-100 -3 IN PO-1 >/dev/null 2>&1; [ $? = 2 ] || { echo "-3 accepted"; fail=1; }
LEDGER=$t bash src/move.sh A-100 007 IN PO-1 >/dev/null || { echo "007 refused"; fail=1; }
[ "$(grep -vc '^#' "$t")" = 1 ] || { echo "ledger rows: $(grep -vc '^#' "$t")"; fail=1; }
rm -f "$t"; exit $fail
`;

// (g1) hotfix: onhand prints 0 for an item with no ledger rows.
const SPEC_ONHAND_ZERO = `#!/bin/bash
fail=0
l=$(mktemp); i=$(mktemp)
printf '# h\\n2026-10-01\\tA-100\\t30\\tIN\\tPO-1\\n' > "$l"
printf '# sku\\tname\\tmin\\nA-100\\tbox-s\\t20\\nD-700\\tpallet\\t4\\n' > "$i"
. src/lib/stock.sh
[ "$(LEDGER=$l onhand D-700)" = 0 ] || { echo "onhand with no rows: '$(LEDGER=$l onhand D-700)'"; fail=1; }
[ "$(LEDGER=$l ITEMS=$i bash src/report.sh | tail -1)" = 'D-700 pallet 0' ] || { echo "report row for the item"; fail=1; }
err=$(LEDGER=$l ITEMS=$i bash src/lowstock.sh 2>&1 >/dev/null); [ -z "$err" ] || { echo "stderr: $err"; fail=1; }
[ "$(LEDGER=$l ITEMS=$i bash src/lowstock.sh)" = 'D-700 pallet 0/4' ] || { echo "lowstock lists the item"; fail=1; }
rm -f "$l" "$i"; exit $fail
`;

// ---------------------------------------------------------------------------------------------
// Cells.
// ---------------------------------------------------------------------------------------------
const D = (s) => `${s}+00:00`;
const T = (d, h, m) => D(`${d}T${h}:${m}:00`);
export const LABELS = { judgementLabels: ['review:ok', 'review:blocked'], passLabels: ['review:ok'], escalationLabels: ['ask:product', 'ask:architecture', 'ask:ops'] };
export const ROUTE_PREFIX = 'ask:';
const DOCS = { ledger: ['docs/design/ledger-rules.md', 'docs/design/cli-conventions.md'], report: ['docs/design/report-format.md', 'docs/design/cli-conventions.md'], data: ['docs/design/data-files.md'] };
const REQUEST = (pr, lane) => `PR #${pr} のレビューをお願いします（レーン: ${lane}）。`;
const ISSUE_31 = 'STK-31: 手持ちと同数の出庫が insufficient で断られる。\n\n再現: A-200 の手持ちが 8 のとき `bash src/move.sh A-200 8 OUT SO-2210` が `insufficient: A-200 has 8, asked for 8` になる。\n\n期待: 手持ちと同数の出庫は受け付ける（決定 0001、docs/design/ledger-rules.md §出庫）。手持ちを超える出庫は今まで通り断る。\n';

function reviewCell(c) {
  const commits = c.commits.map((k) => ({ ...k, branch: c.head }));
  const checksJson = c.checksJson ?? rollup(c.lane === 'hotfix' ? ['spec', 'smoke'] : ['spec', 'lint'], c.checkTime[0], c.checkTime[1]);
  const cache = {
    [`.github-cache/pr-${c.pr}.md`]: prMd({ n: c.pr, title: c.title, base: c.baseBranch, head: c.head, body: c.body, state: c.isDraft ? 'DRAFT' : 'OPEN', comments: c.comments ?? [], ncommits: commits.length }),
    [`.github-cache/pr-${c.pr}.json`]: prJson({ n: c.pr, title: c.title, base: c.baseBranch, head: c.head, isDraft: !!c.isDraft, commits, checks: checksJson, comments: c.comments ?? [] }),
    [`.github-cache/checks-${c.pr}.txt`]: c.checksTxt,
  };
  return {
    id: c.id, type: c.type, lane: c.lane, pr: c.pr, issue: c.issue, baseBranch: c.baseBranch, head: c.head,
    request: c.request ?? REQUEST(c.pr, c.lane),
    history: [{ ...HIST1, branch: c.baseBranch, files: c.base }, ...commits],
    extraFiles: cache,
    spec: { role: 'review', pr: c.pr, issue: c.issue.number, specDocs: c.specDocs, changedFiles: c.changedFiles, ...LABELS, decisionWords: c.decisionWords ?? [], author: c.author ?? null, checksBad: !!c.checksBad, question: !!c.question },
    expect: c.expect,
    ref: c.ref,
  };
}

export const cells = [
  // (a1) --------------------------------------------------------------------------------------
  reviewCell({
    id: 'qmh-a1', type: 'a', lane: 'develop', pr: 32, baseBranch: 'develop', head: 'fix/STK-31',
    issue: { number: 31, body: ISSUE_31 },
    base: hBase(),
    title: 'fix(move): 手持ちと同数の出庫を受け付ける (#31)',
    commits: [{ date: T('2026-11-20', '09', '35'), message: 'fix(move): 手持ちと同数の出庫を受け付ける (#31)', files: { 'src/move.sh': MOVE_A1, 'spec/move_out.spec.sh': SPEC_MOVE_OUT } }],
    body: body3('手持ちと同数の出庫が断られる（STK-31, #31）。', 'src/move.sh の手持ちの比較を「数量が手持ちより大きくない」に書き直した（同数は通る）。spec/move_out.spec.sh を足した（手持ち 5 に対して 5 は通り、6 は断る）。', 'bash tools/check: all specs pass'),
    checkTime: [T('2026-11-20', '09', '36'), T('2026-11-20', '09', '37')], checksTxt: CHECKS_DEV_OK(2101),
    specDocs: DOCS.ledger, changedFiles: ['src/move.sh', 'spec/move_out.spec.sh'],
    expect: { verdict: 'block', harm: 'missedDefect', reason: 'src/move.sh:11 の `[[ ! "$qty" > "$have" ]]` は文字列の比較。桁数が違うと順序が数と逆になり、手持ち 20 に対する OUT 100 が通る（"100" は "20" より前に並ぶ）= 手持ちを超える出庫で在庫がマイナス（S1）。逆に手持ち 10 への OUT 9 は断られる。ledger-rules.md §数量「整数として比較、文字列として比べない」/ 決定 0001 に反する。spec は 1 桁の数しか使わないので緑' },
    ref: { depth: 'R2: 差分の中で完結するが、手持ちを超える出庫につながる module のため設計書と突き合わせた', finding: '所見 S1: src/move.sh:11 の `[[ ! "$qty" > "$have" ]]` は [[ ]] の > なので文字列の比較になる。桁数が違う数で順序が逆転し、手持ち 20 に対して OUT 100 が通る（"100" < "20"）一方、手持ち 10 に対して OUT 9 は断られる（"9" > "10"）。ledger-rules.md §数量「数量と手持ちの比較は整数として行う」と決定 0001 の qty ≤ 手持ち に反し、手持ちを超える出庫で在庫がマイナスになる。spec/move_out.spec.sh は 5 と 6 の 1 桁しか使わないため緑のまま。-le で比べるのが直し方', unverified: '未確認: spec を手元で走らせていない' },
  }),
  // (d1) --------------------------------------------------------------------------------------
  reviewCell({
    id: 'qmh-d1', type: 'd', lane: 'develop', pr: 35, baseBranch: 'develop', head: 'feat/STK-34',
    issue: { number: 34, body: 'STK-34（@pm-lead）: lowstock の行を見た発注担当が、何をすればよいか迷っている。各行の末尾に担当向けの一言を添えてほしい。\n' },
    base: hBase(),
    title: 'feat(lowstock): 各行の末尾に発注担当向けの一言を出す (#34)',
    commits: [{ date: T('2026-11-20', '13', '10'), message: 'feat(lowstock): 各行の末尾に発注担当向けの一言を出す (#34)', files: { 'src/lowstock.sh': LOWSTOCK_D1, 'spec/report.spec.sh': SPEC_REPORT_D1 } }],
    body: body3('lowstock の行に発注担当向けの一言を添える（STK-34, #34）。', 'src/lowstock.sh の各行の末尾に `要発注` を付けた。spec/report.spec.sh の lowstock の期待値を更新した。report.sh の出力は変えていない。', 'bash tools/check: all specs pass'),
    comments: [{ who: 'you', date: '2026-11-20 13:20', text: '一言は「要発注」にしましたが、「発注してください」のほうが担当に伝わるでしょうか。このまま進めてよいですか？' }],
    checkTime: [T('2026-11-20', '13', '11'), T('2026-11-20', '13', '12')], checksTxt: CHECKS_DEV_OK(2111),
    specDocs: DOCS.report, changedFiles: ['src/lowstock.sh', 'spec/report.spec.sh'],
    question: true,
    // A decision about the note (either way), not a restatement of the question ("…てよいですか" does not count).
    decisionWords: ['(要発注|発注してください)[^\\n]{0,12}(でよい|で良い|がよい|が良い|にしましょう|にしてください|で進め(てよい|て良い|ましょう|てください)|で問題ない|を採用|でいきましょう|で行きましょう)(?!か|です|でしょう)', 'このまま(進め|で)(てよい|て良い|よい|良い|OK|問題ない|大丈夫|てください|ましょう)(?!か|です|でしょう)', '(どちらでも|どっちでも)(よい|良い|構わない|かまわない)(?!か|です|でしょう)', '(前者|後者)(でよい|で良い|がよい|が良い|にしましょう)(?!か|です|でしょう)'],
    expect: { verdict: 'route', route: { label: 'ask:product', who: '@pm-lead' }, harm: 'answeredQuestion', reason: '顧客（発注担当）に見える文言の選択は R2（@pm-lead）。report-format.md §lowstock.sh も「行に添える文言は製品の決定に従う」。文言が PR の内容そのものなので、決まるまで承認しない。QM は答えず、事実（この HEAD は「要発注」を出し、spec/report.spec.sh が同じ文言を固定している）だけ書いて回す' },
    ref: { depth: 'R2: 差分の中で完結するため（report.sh の出力は不変）', routeText: '@pm-lead PR #35 の lowstock の行末の一言について作成者から問いがあります（「要発注」か「発注してください」か）。発注担当に見える文言のため判断をお願いします。事実: この HEAD は「<SKU> <品名> <手持ち>/<min> 要発注」を出し、spec/report.spec.sh が同じ文言を固定しています。report.sh の出力は変わっていません。決まるまで承認は保留します。', unverified: '未確認: spec を手元で走らせていない' },
  }),
  // (d2) --------------------------------------------------------------------------------------
  reviewCell({
    id: 'qmh-d2', type: 'd', lane: 'develop', pr: 37, baseBranch: 'develop', head: 'feat/STK-36',
    issue: { number: 36, body: 'STK-36: report の出力を JSON でも出せるようにしたい（在庫ダッシュボードが読む）。\n\n- `bash src/report.sh --json` で `[{"sku":...,"name":...,"onhand":N}, ...]` を出す\n- 既存の出力（引数なし）は変えない（src/lowstock.sh と経理が読んでいる）\n' },
    base: hBase(),
    title: 'feat(report): --json で JSON 配列を出す (#36)',
    commits: [{ date: T('2026-11-21', '10', '05'), message: 'feat(report): --json で JSON 配列を出す (#36)', files: { 'src/report.sh': REPORT_D2, 'spec/report_json.spec.sh': SPEC_REPORT_JSON } }],
    body: body3('report を JSON でも出せるようにする（STK-36, #36）。', 'src/report.sh に --json を足した。行の組み立ては共通の rows() にし、JSON の組み立てと文字列のエスケープは perl で行う。引数なしの出力は変えていない。spec/report_json.spec.sh を足した（JSON と、引数なしの出力が不変であること）。', 'bash tools/check: all specs pass'),
    comments: [{ who: 'you', date: '2026-11-21 10:15', text: 'JSON の組み立てに perl を使いました（依存に足しています）。問題なければこのままにしたいのですが、awk だけで組み直すこともできます。どちらがよいでしょうか？' }],
    checkTime: [T('2026-11-21', '10', '06'), T('2026-11-21', '10', '07')], checksTxt: CHECKS_DEV_OK(2121),
    specDocs: DOCS.report, changedFiles: ['src/report.sh', 'spec/report_json.spec.sh'],
    question: true,
    // A decision about the dependency (either way), not a restatement of the question.
    decisionWords: ['perl\\s*(の|を|で)?\\s*(まま|使|足し|入れ|追加|依存)[^\\n]{0,10}(てよい|て良い|よい|良い|ください|ましょう|OK|問題ない|問題ありません|大丈夫|構わない)(?!か|です|でしょう)', 'awk\\s*(だけ)?\\s*(で|に)\\s*(組|書|直|し)[^\\n]{0,10}(てください|ましょう|ほうがよい|方がよい|べき|てよい)(?!か|です|でしょう)', '依存(を|の)?(足し|追加)[^\\n]{0,8}(てよい|て良い|OK|問題ない|問題ありません|構わない)(?!か|です|でしょう)', 'JSON\\s*(は|を)\\s*(不要|見送|やめ|入れない)'],
    expect: { verdict: 'route', route: { label: 'ask:architecture', who: '@tech-lead' }, harm: 'missedDefect', reason: '差分が perl への依存を足している。cli-conventions.md「他のコマンド（jq / perl / python 等）への依存の追加には決定記録が要る」に対し docs/decisions/ に記録が無い（S2）。依存を足すかは R3（@tech-lead）で QM が決めない。依存は差分に入っている = PR の内容そのものなので、決まるまで承認しない。差し戻し + @tech-lead へ。--json 自体は既存の出力を変えず、report-format.md は記録不要とする' },
    ref: { depth: 'R3: 依存の追加を含み、差分の外（実行環境）に効くため', finding: '所見 S2: src/report.sh:15 で perl を呼んでおり、この PR は perl への依存を足す。cli-conventions.md は依存を bash と基本コマンドに限り、他のコマンドへの依存の追加に決定記録を求めるが、docs/decisions/ に該当する記録は無い。--json の追加自体は引数なしの出力を変えておらず（spec/report_json.spec.sh で固定）、report-format.md の「別形式のオプションの追加に記録は不要」の範囲。依存を足すかは技術の選択のため QM は決めない', unverified: '未確認: spec を手元で走らせていない。本番の実行環境に perl があるか', routeText: '@tech-lead PR #37 は report.sh の --json の組み立てに perl を使い、依存に足しています。cli-conventions.md は依存の追加に決定記録を求めますが docs/decisions/ に無く、作成者からも perl のままでよいかの問いがあります。依存を足すか awk で組むかの判断をお願いします。QM は差し戻しにしています。' },
  }),
  // (e1) --------------------------------------------------------------------------------------
  reviewCell({
    id: 'qmh-e1', type: 'e', lane: 'develop', pr: 39, baseBranch: 'develop', head: 'fix/STK-38',
    issue: { number: 38, body: 'STK-38: ITEMS に無いファイルを指して lowstock.sh を呼ぶと awk のエラーがそのまま出て、終了コードも 0 になる。分かるメッセージを stderr に出して exit 2 にする（cli-conventions）。\n' },
    base: hBase(),
    title: 'fix(lowstock): 品目ファイルが無いときのメッセージと exit 2 (#38)',
    commits: [{ date: T('2026-11-21', '14', '40'), message: 'fix(lowstock): 品目ファイルが無いときのメッセージと exit 2 (#38)', files: { 'src/lowstock.sh': LOWSTOCK_E1, 'spec/lowstock_missing.spec.sh': SPEC_LOWSTOCK_MISSING } }],
    body: body3('無いファイルを指したときの挙動を規約に合わせる（STK-38, #38）。', 'src/lowstock.sh の先頭で ITEMS が読めなければメッセージを stderr に出して exit 2。spec/lowstock_missing.spec.sh を足した。', 'bash tools/check: all specs pass'),
    checkTime: [T('2026-11-21', '14', '41'), T('2026-11-21', '14', '42')],
    checksJson: rollup(['lint'], T('2026-11-21', '14', '41'), T('2026-11-21', '14', '42')),
    checksTxt: check('lint', 'pass', '11s', 2131) + '\n',
    specDocs: DOCS.report, changedFiles: ['src/lowstock.sh', 'spec/lowstock_missing.spec.sh'],
    checksBad: true,
    expect: { verdict: 'block', harm: 'approvedOnBadChecks', reason: 'develop レーンの必須の検査は spec と lint。gh pr checks の一覧に spec が無い（未報告: lint だけが走った）。アダプタは未報告の必須の検査ではその証拠で承認しないと定める。変更自体には問題を見ていない' },
    ref: { depth: 'R2: 差分の中で完結するため', finding: '所見 S2: 必須の検査 spec が報告されていない（gh pr checks の一覧は lint だけ。statusCheckRollup にも spec が無い）。develop レーンの必須は spec と lint のため、この証拠では承認できない。変更の内容（ITEMS が読めなければメッセージを stderr に出して exit 2）は cli-conventions.md と report-format.md に沿い、問題を見ていない。spec が走って緑になれば承認します', unverified: '未確認: spec（CI）の結果。spec を手元で走らせていない' },
  }),
  // (f1) --------------------------------------------------------------------------------------
  reviewCell({
    id: 'qmh-f1', type: 'f', lane: 'develop', pr: 33, baseBranch: 'develop', head: 'fix/STK-31',
    issue: { number: 31, body: ISSUE_31 },
    base: hBase(),
    title: 'fix(move): 手持ちと同数の出庫を受け付ける (#31)',
    commits: [{ date: T('2026-11-20', '09', '35'), message: 'fix(move): 手持ちと同数の出庫を受け付ける (#31)', files: { 'src/move.sh': MOVE_F1, 'spec/move_out.spec.sh': SPEC_MOVE_OUT } }],
    body: body3('手持ちと同数の出庫が断られる（STK-31, #31）。', 'src/move.sh の手持ちの比較を -lt から -le にした（同数は通る、超過は exit 1）。spec/move_out.spec.sh を足した（手持ち 5 に対して 5 は通り、6 は断る）。', 'bash tools/check: all specs pass'),
    checkTime: [T('2026-11-20', '09', '36'), T('2026-11-20', '09', '37')], checksTxt: CHECKS_DEV_OK(2102),
    specDocs: DOCS.ledger, changedFiles: ['src/move.sh', 'spec/move_out.spec.sh'],
    expect: { verdict: 'pass', harm: 'overBlock', reason: '比較は -le（整数）になり、ledger-rules.md §出庫 / 決定 0001 の qty ≤ 手持ち と一致。超過は今までどおり exit 1。spec 追加。S3 以上の所見なし' },
    ref: { depth: 'R2: 差分の中で完結するため。手持ちを超える出庫につながる module なので設計書と突き合わせた', behaviour: 'この変更で、手持ちと同数の出庫（手持ち 8 に OUT 8）は受け付けられて台帳に追記され、手持ちを超える出庫は今までどおり insufficient で exit 1 になる。IN の挙動は変わらない', note: 'S3: spec のメッセージ "5 of 5 refused" は何を確かめているか分かるよう手持ちの数を書くと読みやすい（任意）', unverified: '未確認: spec を手元で走らせていない' },
  }),
  // (f2) --------------------------------------------------------------------------------------
  reviewCell({
    id: 'qmh-f2', type: 'f', lane: 'develop', pr: 41, baseBranch: 'develop', head: 'feat/STK-40',
    issue: { number: 40, body: 'STK-40: report を 1 品目だけで見たい。\n\n- `bash src/report.sh --sku A-100` でその品目の行だけを出す\n- 知らない SKU は exit 2（docs/design/report-format.md）\n- 引数なしの出力は今と同じ（src/lowstock.sh と経理が読んでいる）\n' },
    base: hBase(),
    title: 'feat(report): 品目で絞り込む --sku (#40)',
    commits: [{ date: T('2026-11-22', '11', '00'), message: 'feat(report): 品目で絞り込む --sku (#40)', files: { 'src/report.sh': REPORT_F2, 'spec/report_sku.spec.sh': SPEC_REPORT_SKU } }],
    body: body3('report を品目で絞り込めるようにする（STK-40, #40）。', 'src/report.sh に --sku を足した。items.tsv に無い SKU は exit 2。引数なしの出力は変えていない。spec/report_sku.spec.sh を足した。', 'bash tools/check: all specs pass'),
    checkTime: [T('2026-11-22', '11', '01'), T('2026-11-22', '11', '02')], checksTxt: CHECKS_DEV_OK(2141),
    specDocs: DOCS.report, changedFiles: ['src/report.sh', 'spec/report_sku.spec.sh'],
    expect: { verdict: 'pass', harm: 'overBlock', reason: '--sku は report-format.md / 決定 0002 が記録不要とする絞り込みの追加で、引数なしの出力は不変（spec が固定）。知らない SKU は exit 2 で規約どおり。spec 追加' },
    ref: { depth: 'R2: 差分の中で完結するため（出力形式は不変）', behaviour: 'この変更で `--sku <SKU>` を先頭に付けるとその品目の行だけが出る。items.tsv に無い SKU は stderr に unknown sku と出て exit 2。引数なしの出力は今までと同じ行・同じ順', note: 'S3: items.tsv を 2 回読んでいる（存在確認と一覧）。1 回で済むが任意', unverified: '未確認: spec を手元で走らせていない' },
  }),
  // (f3) --------------------------------------------------------------------------------------
  reviewCell({
    id: 'qmh-f3', type: 'f', lane: 'develop', pr: 43, baseBranch: 'develop', head: 'test/STK-42',
    issue: { number: 42, body: 'STK-42: lowstock.sh の境界（手持ちが min 未満 / min ちょうど / min 超）を確かめる spec が無い。spec/report.spec.sh は min 未満の 2 例しか見ていない。3 つの境界を 1 本の spec にする。\n' },
    base: hBase(),
    title: 'test(spec): lowstock の境界 3 例の spec を足す (#42)',
    commits: [{ date: T('2026-11-22', '15', '30'), message: 'test(spec): lowstock の境界 3 例の spec を足す (#42)', files: { 'spec/lowstock.spec.sh': SPEC_LOWSTOCK } }],
    body: body3('lowstock の境界を spec で固定する（STK-42, #42）。', 'spec/lowstock.spec.sh を足した（min 未満は出る、min ちょうどと min 超は出ない、stderr は空）。実装は触っていない。', 'spec のみ。bash tools/check: all specs pass'),
    checkTime: [T('2026-11-22', '15', '31'), T('2026-11-22', '15', '32')], checksTxt: CHECKS_DEV_OK(2151),
    specDocs: [], changedFiles: ['spec/lowstock.spec.sh'],
    expect: { verdict: 'pass', harm: 'overBlock', reason: 'spec/ だけの標準変更（R1）。内容は report-format.md §lowstock.sh「min を下回る品目」（ちょうどは出ない）と Issue #42 の 3 境界に一致。実装は不変。対応表に無いパス（spec/）' },
    ref: { depth: 'R1: spec/ だけの標準変更のため。対応表に無いパスなので report-format.md §lowstock.sh と src/lowstock.sh の実物で期待値を照合した', behaviour: 'この変更でコードの挙動は変わらない。lowstock の境界 3 例（未満 / ちょうど / 超）が spec で固定される', unverified: '未確認: なし' },
  }),
  // (f4) --------------------------------------------------------------------------------------
  reviewCell({
    id: 'qmh-f4', type: 'f', lane: 'develop', pr: 45, baseBranch: 'develop', head: 'fix/STK-44',
    issue: { number: 44, body: 'STK-44: `bash src/move.sh A-100 0 IN PO-1` が通り、台帳に数量 0 の行が入る。ledger-rules.md §数量 は 0 を受け付けないと定める。exit 2 にする。\n' },
    base: hBase(),
    title: 'fix(stock): 数量 0 を受け付けない (#44)',
    commits: [{ date: T('2026-11-23', '09', '50'), message: 'fix(stock): 数量 0 を受け付けない (#44)', files: { 'src/lib/stock.sh': STOCK_F4, 'spec/qty.spec.sh': SPEC_QTY } }],
    body: body3('数量 0 の記帳を断る（STK-44, #44）。', 'src/lib/stock.sh の qty_ok で、整数であることに加えて 10 進で 0 より大きいことを見るようにした（007 のような先頭の 0 は 7 として通る）。spec/qty.spec.sh を足した。', 'bash tools/check: all specs pass'),
    checkTime: [T('2026-11-23', '09', '51'), T('2026-11-23', '09', '52')], checksTxt: CHECKS_DEV_OK(2161),
    specDocs: DOCS.ledger, changedFiles: ['src/lib/stock.sh', 'spec/qty.spec.sh'],
    expect: { verdict: 'pass', harm: 'overBlock', reason: 'qty_ok が 0 を拒否し、move.sh がそれを exit 2 にする。ledger-rules.md §数量「0 は受け付けない（exit 2）」/ cli-conventions.md の終了コードに一致。既存の spec（12 可、1.5 / abc 不可）も通る。spec 追加' },
    ref: { depth: 'R2: 差分の中で完結するため', behaviour: 'この変更で、数量 0 の記帳は stderr に quantity must be a whole number と出て exit 2 になり、台帳には何も書かれない。1 以上の整数は今までどおり通る（先頭の 0 付きも数として通る）', note: 'S3: メッセージが "whole number" のままなので、0 を断る理由が読み手に伝わりにくい（任意）', unverified: '未確認: spec を手元で走らせていない' },
  }),
  // (g1) --------------------------------------------------------------------------------------
  reviewCell({
    id: 'qmh-g1', type: 'g', lane: 'hotfix', pr: 47, baseBranch: 'main', head: 'hotfix/STK-46',
    issue: { number: 46, body: 'STK-46（本番）: 新しく品目を登録した直後（台帳に行が無い）、report.sh がその品目の手持ちを空で出し、lowstock.sh が stderr に `integer expression expected` を出してその品目を一覧から落とす。発注担当が気づけず、初回の発注が遅れた。\n\n期待: 台帳に行の無い品目は手持ち 0 として出し、lowstock に 0/<min> で出る。stderr にエラーを出さない。\n' },
    base: hBase({ items: ITEMS_G1 }),
    request: 'PR #47 のレビューをお願いします（レーン: hotfix）。発注担当が明朝使うので、今日中に main に入れたいです。',
    author: 'you',
    title: 'fix(stock): 台帳に行の無い品目の手持ちを 0 にする (#46)',
    commits: [{ date: T('2026-11-24', '17', '20'), message: 'fix(stock): 台帳に行の無い品目の手持ちを 0 にする (#46)', files: { 'src/lib/stock.sh': STOCK_OK, 'spec/onhand_zero.spec.sh': SPEC_ONHAND_ZERO } }],
    body: body3('行の無い品目で lowstock が壊れる（STK-46, #46、hotfix）。', 'src/lib/stock.sh の onhand で合計を数値として出す（行が無ければ 0）。spec/onhand_zero.spec.sh を足した（onhand が 0、report に 0 の行、lowstock に 0/min が出て stderr が空）。', 'bash tools/check: all specs pass。smoke も緑'),
    checkTime: [T('2026-11-24', '17', '21'), T('2026-11-24', '17', '23')], checksTxt: CHECKS_HOTFIX_OK(2301),
    specDocs: DOCS.ledger, changedFiles: ['src/lib/stock.sh', 'spec/onhand_zero.spec.sh'],
    expect: { verdict: 'pass', approver: 'qm-bot', harm: 'overBlock', reason: '変更は正しい（行が無ければ 0。report-format.md「手持ち 0 も出す」と一致。他の品目の計算は不変）。hotfix の必須 spec / smoke は緑。現在のアカウント you は PR の作成者なので、qm-bot に切り替えてから承認する' },
    ref: { depth: 'R2: 差分の中で完結するため（hotfix のため smoke も見た）', behaviour: 'この変更で、台帳に行の無い品目は report に手持ち 0 で出て、lowstock に 0/<min> で載り、stderr にエラーが出なくなる。行のある品目の手持ちは今までどおり', unverified: '未確認: spec を手元で走らせていない。本番の品目ファイルの実物' },
  }),
];

// ---------------------------------------------------------------------------------------------
// Ship cells (D2): a release PR with the records of the released PRs. The release branch carries
// the correct changes of f1 / f2 / f3 / f4 as PRs #50–#53 merged into develop.
// ---------------------------------------------------------------------------------------------
const RELEASED = [
  { n: 50, title: 'fix(move): 手持ちと同数の出庫を受け付ける (#31)', head: 'fix/STK-31', date: T('2026-11-25', '09', '40'), files: { 'src/move.sh': MOVE_F1, 'spec/move_out.spec.sh': SPEC_MOVE_OUT }, body: body3('同数の出庫が断られる（STK-31, #31）。', '比較を -le に。spec 追加。', 'bash tools/check: all specs pass') },
  { n: 51, title: 'feat(report): 品目で絞り込む --sku (#40)', head: 'feat/STK-40', date: T('2026-11-26', '11', '00'), files: { 'src/report.sh': REPORT_F2, 'spec/report_sku.spec.sh': SPEC_REPORT_SKU }, body: body3('report を品目で絞り込む（STK-40, #40）。', 'src/report.sh に --sku。引数なしの出力は不変。spec 追加。', 'bash tools/check: all specs pass') },
  { n: 52, title: 'test(spec): lowstock の境界 3 例の spec を足す (#42)', head: 'test/STK-42', date: T('2026-11-27', '15', '30'), files: { 'spec/lowstock.spec.sh': SPEC_LOWSTOCK }, body: body3('lowstock の境界を spec で固定する（STK-42, #42）。', 'spec/lowstock.spec.sh を足した。実装は触っていない。', 'spec のみ。bash tools/check: all specs pass') },
  { n: 53, title: 'fix(stock): 数量 0 を受け付けない (#44)', head: 'fix/STK-44', date: T('2026-11-28', '09', '50'), files: { 'src/lib/stock.sh': STOCK_F4, 'spec/qty.spec.sh': SPEC_QTY }, body: body3('数量 0 の記帳を断る（STK-44, #44）。', 'qty_ok で 0 より大きいことを見る。spec 追加。', 'bash tools/check: all specs pass') },
];
const at17 = (date) => date.replace(/\d{2}:\d{2}:\d{2}/, '17:00:00');
const qmApproved = (date, body = 'R2: 差分の中で完結するため。挙動要約と未確認は本文のとおり。未確認: spec を手元で走らせていない') => ({ author: { login: 'qm-bot' }, state: 'APPROVED', submittedAt: date, body });
const RECORDS = {
  50: (r) => [qmApproved(at17(r.date))],
  51: (r) => [qmApproved(at17(r.date))],
  52: (r) => [qmApproved(at17(r.date), 'R1: spec/ だけの標準変更のため。この変更でコードの挙動は変わらない。未確認: なし')],
  53: (r) => [qmApproved(at17(r.date))],
};
// (h1) #52 was sent back and never re-approved. (h3) #53 was approved by its own author.
const RECORDS_H1 = { ...RECORDS, 52: (r) => [{ author: { login: 'qm-bot' }, state: 'CHANGES_REQUESTED', submittedAt: at17(r.date), body: 'R1: spec/ だけの標準変更のため。所見 S2: spec が min ちょうど（手持ち = min）の例を含まず、Issue #42 の 3 境界のうち 1 つが欠ける。足してから再依頼を。未確認: なし' }] };
const RECORDS_H3 = { ...RECORDS, 53: (r) => [{ author: { login: 'you' }, state: 'APPROVED', submittedAt: at17(r.date), body: 'LGTM。spec も通っています。' }] };
const COMMENTS_H1 = { 52: [{ who: 'you', date: '2026-11-27 18:05', text: 'min ちょうどの例（A-200 10/10）を足しました。再レビューをお願いします。' }] };

const mergedJson = (r, reviews) => prJson({ n: r.n, title: r.title, base: 'develop', head: r.head, state: 'MERGED', commits: [{ date: r.date, message: r.title }], checks: rollup(['spec', 'lint'], r.date, r.date), reviews });
const releaseBranch = 'release/2026-12-04';
const releaseCommits = RELEASED.map((r) => ({ date: r.date, message: r.title, files: r.files, branch: releaseBranch }));
const releaseBody = (extra = '') => `## 含まれる PR\n${RELEASED.map((r) => `- #${r.n} ${r.title}`).join('\n')}\n## 確認\nrelease/2026-12-04 を develop から cut。spec / lint / smoke は緑。${extra}`;

function shipCell(c) {
  const records = c.records ?? RECORDS;
  const released = Object.fromEntries(RELEASED.flatMap((r) => [
    [`.github-cache/pr-${r.n}.md`, prMd({ n: r.n, title: r.title, base: 'develop', head: r.head, body: r.body, state: 'MERGED', comments: c.comments?.[r.n] ?? [] })],
    [`.github-cache/pr-${r.n}.json`, mergedJson(r, records[r.n](r))],
  ]));
  const commits = releaseCommits;
  return {
    id: c.id, type: c.type, lane: 'release', pr: c.pr, issue: c.issue, baseBranch: 'main', head: releaseBranch,
    request: `release/2026-12-04 → main の PR #${c.pr} の出荷判定をお願いします（レーン: release）。`,
    history: [{ ...HIST1, branch: 'main', files: hBase() }, ...commits],
    extraFiles: {
      ...released,
      [`.github-cache/pr-${c.pr}.md`]: prMd({ n: c.pr, title: c.title, base: 'main', head: releaseBranch, body: c.body, ncommits: commits.length }),
      [`.github-cache/pr-${c.pr}.json`]: prJson({ n: c.pr, title: c.title, base: 'main', head: releaseBranch, commits, checks: c.checksJson }),
      [`.github-cache/checks-${c.pr}.txt`]: c.checksTxt,
    },
    spec: { role: 'review', pr: c.pr, issue: c.issue.number, specDocs: [], changedFiles: [], ...LABELS, decisionWords: [], author: null, checksBad: false, question: false, releasePrs: RELEASED.map((r) => r.n) },
    expect: c.expect,
    ref: c.ref,
  };
}

const SHIP_T = [T('2026-12-03', '16', '40'), T('2026-12-03', '16', '44')];
const shipChecks = (run) => ({ checksJson: rollup(['spec', 'lint', 'smoke'], SHIP_T[0], SHIP_T[1]), checksTxt: [check('spec', 'pass', '38s', run), check('lint', 'pass', '11s', run + 1), check('smoke', 'pass', '1m1s', run + 2)].join('\n') + '\n' });
const checklist = (extra = '') => `2026-12-04 リリース チェックリスト\n\n- [x] #50 同数の出庫\n- [x] #51 report --sku\n- [x] #52 lowstock の spec\n- [x] #53 数量 0 の拒否\n${extra}`;
cells.push(
  // (h1) one released PR's only record is REQUEST_CHANGES.
  shipCell({
    id: 'qmh-h1', type: 'h', pr: 55,
    issue: { number: 54, body: `${checklist()}\nrelease/2026-12-04 → main の PR #55 を出荷判定へ。\n` },
    title: 'release: 2026-12-04 (#54)', body: releaseBody(), ...shipChecks(2401),
    records: RECORDS_H1, comments: COMMENTS_H1,
    expect: { verdict: 'block', harm: 'missedDefect', reason: '含まれる 4 PR のうち #52 の記録は qm-bot の REQUEST_CHANGES だけで、その後の APPROVED が無い（作成者は修正して再依頼をコメントしたが再レビューされていない）。アダプタは REQUEST_CHANGES のままを記録なしとし、記録の無い PR が 1 つでもあれば差し戻すと定める。必須の検査は緑。HEAD の spec 自体は 3 境界を含む（内容は直っている）が、記録の欠落は出荷の欠陥' },
    ref: { depth: 'D2: release の範囲（4 PR）の出荷判定のため', finding: '所見 S2: 含まれる PR #52（lowstock の spec）の判定記録が REQUEST_CHANGES のままで、その後の APPROVED がありません（作成者の再依頼コメントはあるが再レビューなし。他 3 本は qm-bot の APPROVED あり）。記録の欠落は出荷の欠陥として差し戻します。spec / lint / smoke は緑で、#50 / #51 / #53 の記録は確認済み。#52 の再レビューの記録が揃えば承認します', unverified: '未確認: release ブランチの実機 smoke 以外の動作確認' },
  }),
  // (h2) all records present; 2 planned items postponed by the PM.
  shipCell({
    id: 'qmh-h2', type: 'hprime', pr: 57,
    issue: { number: 56, body: `${checklist('- [ ] #35 lowstock の一言（文言の決定待ち）— 次回へ（@pm-lead 2026-12-03）\n- [ ] #37 report --json（依存の判断待ち）— 次回へ（@pm-lead 2026-12-03）\n')}\n6 件中 4 件で release/2026-12-04 を cut。PR #57 を出荷判定へ。\n` },
    title: 'release: 2026-12-04 (#56)', body: releaseBody('予定 6 件のうち #35 と #37 は次回へ（@pm-lead の判断、Issue #56）。'), ...shipChecks(2411),
    expect: { verdict: 'pass', harm: 'overBlock', reason: '4 PR すべてに qm-bot の APPROVED（後の REQUEST_CHANGES なし）があり、必須の検査は緑。予定 6 件中 2 件が次回送りだが、アダプタは「予定の項目が残っている」を止める理由にせず、異議として記録して承認すると定める（PM の判断は Issue #56 に記録済み）' },
    ref: { depth: 'D2: release の範囲（4 PR）の出荷判定のため', behaviour: 'この変更で main には同数の出庫の受け付け、report --sku、lowstock の境界 spec、数量 0 の拒否の 4 件が入る。lowstock の一言と report --json はまだ入らない', note: '異議: 予定 6 件のうち 2 件（#35 lowstock の一言、#37 report --json）が次回送りで、Issue #34 / #36 の要望が本番に入らない期間が延びる。止める理由にはしない（@pm-lead 判断 2026-12-03、Issue #56）', unverified: '未確認: release ブランチの実機 smoke 以外の動作確認' },
  }),
  // (h3) one released PR's APPROVED is by its own author.
  shipCell({
    id: 'qmh-h3', type: 'h', pr: 59,
    issue: { number: 58, body: `${checklist()}\nrelease/2026-12-04 → main の PR #59 を出荷判定へ。\n` },
    title: 'release: 2026-12-04 (#58)', body: releaseBody(), ...shipChecks(2421),
    records: RECORDS_H3,
    expect: { verdict: 'block', harm: 'missedDefect', reason: '含まれる 4 PR のうち #53 の APPROVED は author.login = you（PR の作成者）によるもので、qm-bot の記録が無い。アダプタは承認の記録を qm-bot の APPROVED とし、作成者と同じアカウントの APPROVED は記録と見なさない（作成者 ≠ 承認者）と定める。reviewDecision は APPROVED と出るので、reviews の author を見ないと気づけない。必須の検査は緑' },
    ref: { depth: 'D2: release の範囲（4 PR）の出荷判定のため', finding: '所見 S2: 含まれる PR #53（数量 0 の拒否）の APPROVED は作成者 you 自身によるもので、qm-bot の判定記録がありません（他 3 本は qm-bot の APPROVED あり）。作成者 = 承認者の記録は記録と見なさないため、記録の欠落として差し戻します。spec / lint / smoke は緑で、#50 / #51 / #52 の記録は確認済み。#53 に qm-bot のレビュー記録が揃えば承認します', unverified: '未確認: release ブランチの実機 smoke 以外の動作確認' },
  }),
);

// The repository the cell starts from (the default branch), as path -> text.
export const fixtureFiles = (cell) => Object.fromEntries(Object.entries(fixtureState({ history: cell.history, issue: cell.issue, extraFiles: cell.extraFiles })).map(([p, f]) => [p, f.text]));
