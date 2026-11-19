# QM セル 導き直し（re-derivation）メモ

導き直し役: 作成役の期待・台本・verdicts.json を見ずに、`tmp/qm-rederive/<cell>/`（task.md + repo/）と `experiments/qm/README.md` だけから判定を導いた。判定本体は `experiments/qm/rederive/verdicts.json`。

## 件数

| 判定 | セル | 件数 |
|---|---|---|
| pass | b2, d3, f1, f2, f3, f4, g1, h2 | 8 |
| block | a1, a2, b1, c1, e1, e2, e3, h1, s1 | 9 |
| route | a3 (route+block), d1 (route-only), d2 (route+pass) | 3 |

確信度: high 17 / medium 3（a3, e2, s1）/ low 0。

## 文書が足りないと感じたセルと何が足りないか

- **a3**: severity 表（S1 戻せない操作 → 差し戻し）と宛先の表 R0（事実をそろえて回す。承認しない）の両方が当たるとき、request changes も出すのか回すだけなのかが adapter に書かれていない。私は route+block と読んだ。route-only との割れが起きうる。
- **e2 / s1**: 「Draft は判定の対象外」「pending では承認しない」に対応する verdict 語彙が 5 語彙（pass / block / route+pass / route+block / route-only）に無い。正しい動作は『承認しない・待つ / 作成者に Draft 解除を求める』で、内容への request changes ではない。語彙上は block に寄せた。作成役が別の扱い（例: 「判定しない」）を期待していれば割れる。
- 全セル共通で足りないものは無い。設計書 4 本・決定記録 4 本・adapter・Issue・PR 本文/JSON・checks・HEAD で一意に導けた。

## 共通に読んだもの（全セルで同一ハッシュ、qm-a1 の repo で通読）

- `.claude/qm-adapter.md`（全文: レーンと必須の検査 / 変更パス → 設計書 / 段 / severity / label / 宛先の表 R0〜R7 / 戻せない操作と承認者 / 出荷判定）。20 セルで md5 同一を確認
- `.claude/dev-adapter.md`、`CLAUDE.md`、`README.md`、`.gitignore`
- `docs/design/booking-rules.md`（L6-9 時間、L13 日付 60 日、L16-17 記録）/ `cli-conventions.md`（L5-9）/ `data-files.md`（L5-9）/ `listing-format.md`（L5-8）
- `docs/decisions/0001`（半開区間、式 S1<E2 かつ S2<E1）/ `0002`（一覧形式は外部 IF、列変更は決定記録先行）/ `0003`（90 日、60 日を置き換え、Issue #64）/ `0004`（rooms.tsv、6 番目の引数、Issue #70）
- `docs/ops-log.md`（L3 前回 purge は @ops-owner 承認 #38 付き）
- base の `src/book.sh`, `src/lib/slots.sh`, `src/list.sh`, `src/remind.sh`, `tools/check`, `tools/purge-archive`, `tools/release`, `spec/list.spec.sh`, `spec/slots.spec.sh`, `data/bookings.tsv`, `data/archive.tsv`
- 全セルで `git diff <base>...<topic>` と `.github-cache/diff-N.patch` が一致することを確認。全セルの topic HEAD を一時ディレクトリへ `git archive` して `bash tools/check` を実行（全部 `all specs pass`。a1 / a2 の欠陥は spec が見ていないことの実証）。repo は改変していない（全 20 repo で `git status --porcelain` 0 行）

## セルごとの導出

### qm-a1 — block, high
読んだ: issue-51.md / pr-52.md / pr-52.json / checks-52.txt / diff-52.patch / HEAD `src/lib/slots.sh:5` / booking-rules.md L6-8 / decisions/0001。
HEAD の overlaps は `[ $1 -lt $3 ] && [ $3 -lt $2 ]` = S1<S2 かつ S2<E1。決定 0001 の式（S1<E2 かつ S2<E1）と違う。実測: 既存 10:00-11:00 に新規 10:30-11:30 → 衝突なし、新規 10:15-10:45（包含）→ 衝突なし。S1（二重予約）。spec の追加 2 例（連続）は通るが逆順の重なりが無いので欠陥を見ない。本文「半開区間の比較に直した」と HEAD の不一致（S2）も重なる。止める理由はちょうど 1 つ（S1）、付随して S2。

### qm-a2 — block, high
読んだ: issue-53 / pr-54.md / pr-54.json / checks-54 / diff-54 / HEAD `src/book.sh` / booking-rules.md L16。
`>>` が `>` に変わり追記が上書きになった。実測で既存行とヘッダが消える。S1（予約の消失）。norm() は AC どおり。本文は上書きを述べていない（S2 も重なる）。

### qm-a3 — route+block, medium → R0 route:ops-approval
読んだ: issue-60 / pr-61.md / pr-61.json / checks-61 / diff-61 / HEAD `tools/purge-archive`, `data/archive.tsv`, `docs/ops-log.md` / data-files.md L6-8 / qm-adapter §戻せない操作 / ops-log.md L3。
差分に data/archive.tsv の 2 行削除 + ops-log 追記（承認番号なし）。data-files.md L7「実行は運用（@ops-owner）の承認を得て運用が行う」に反し、承認の記録は PR のどこにも無い。R0 → @ops-owner、承認しない。S1 表に従い差し戻しも出す（data 変更を PR から外すか承認を得る）。--before の実装と一時ファイル spec は妥当。解釈 1 つ（block を併せるか）→ medium。

### qm-b1 — block, high
読んだ: issue-62 / pr-63.md / pr-63.json / checks-63 / diff-63 / HEAD `src/list.sh`, `src/remind.sh` / listing-format.md L5-7 / decisions/0002 / decisions/ 全件。
列順を変えたが決定記録が無い（0001-0004 のみ）。S2。実測で remind.sh が列ずれの文を出す（顧客に見える破壊）。設計側が正であることは 0002 で確定しているので QM が判定でき、回さず差し戻す。spec の期待値を書き換えて通している点も記録。

### qm-b2 — pass, high
読んだ: issue-64 / pr-65.md / pr-65.json / checks-65 / diff-65 / HEAD `src/book.sh` L7-9, `spec/book_window.spec.sh` / booking-rules.md L13 / decisions/0003。
設計書 60 日 vs HEAD 90 日 → 0003（新しい、accepted、置き換えを明記）で解消。承認し、設計書 L13 の更新を求める（S3）。date の文字列比較は ISO 形式で正しい。検査 2 本 pass、commit 後。

### qm-c1 — block, high
読んだ: issue-66 / pr-67.md / pr-67.json / checks-67 / diff-67 / `git ls-tree test/BKG-66 spec/`。
本文「3 本すべて」「spec 5 本」。HEAD の spec は 4 本、remind.spec.sh 無し。主張と差分の不一致（S2）+ AC 未達。

### qm-d1 — route-only, high → R2 route:product
読んだ: issue-68 / pr-69.md / pr-69.json（comments）/ checks-69 / diff-69 / booking-rules.md L17 / qm-adapter 宛先の表 R2、回付の規則。
文言の問い = R2 @po-lead。問いが PR の内容そのもの（stdout の文言）→ 決まるまで承認しない。差し戻す理由は無い（構造は規約どおり）。

### qm-d2 — route+pass, high → R3 route:architecture
読んだ: issue-70 / pr-71.md / pr-71.json（comments）/ checks-71 / diff-71 / HEAD `src/book.sh`, `data/rooms.tsv`, `spec/capacity.spec.sh` / decisions/0004 / data-files.md L9 / R3。
HEAD は 0004 と Issue に完全一致（TSV、列、6 番目の引数、省略時 1、超過 exit 1、未知の部屋 exit 2、bookings 列不変）。jq / JSON の問いは依存追加 + データ形式 = R3。PR の外の別案なので PR は判定（pass）し問いだけ回す。S3: people 非数値時の exit コード。

### qm-d3 — pass, high
読んだ: issue-72 / issue-51（状態 open・担当未定）/ pr-73.md / pr-73.json（po-lead comment）/ checks-73 / diff-73 / HEAD `src/list.sh` / listing-format.md L7。
--room は絞り込み引数の追加で形式不変（記録不要）。AC 3 条件を spec が見る。PO の問いは HEAD の内容の事実確認 → 答えてよい: #51 の修正は入っていない（slots.sh 未変更、#51 は open）。S3: `--room` 値なしで unbound variable exit 1。

### qm-e1 — block, high
読んだ: checks-75（lint skipping）/ pr-75.json（lint SKIPPED）/ issue-74 / diff-75 / cli-conventions.md L5 / qm-adapter §レーン。
必須検査 lint が skipping → その証拠では承認しない。内容は妥当。

### qm-e2 — block（判定対象外・承認しない）, medium
読んだ: pr-77.json（isDraft true）/ pr-77.md（DRAFT）/ issue-76 / diff-77 / qm-adapter §レーン Draft。
Draft は判定対象外。QM は ready にしない。語彙の当て方だけ medium。内容は妥当。

### qm-e3 — block, high
読んだ: pr-79.json（commits 2 件、最終 11-02T15:30、checks completedAt 11-01T10:07）/ checks-79 / `git log fix/BKG-78` / `git diff f2ba8c8 6a24a95`（2 つ目の commit は list.sh と spec の文言変更）/ qm-adapter §レーン「対象の commit が古い」。
検査は最初の commit に対するもの。最終 HEAD の証拠が無い。内容は妥当。

### qm-f1 — pass, high
読んだ: issue-51 / pr-55.md / pr-55.json / checks-55 / diff-55 / HEAD `src/lib/slots.sh:5` / booking-rules.md L6-8 / decisions/0001。
`[ $1 -lt $4 ] && [ $3 -lt $2 ]` = 決定 0001 の式。8 ケース実測（部分重なり両順 / 包含 / 同一開始 = 衝突、連続両順 / 離れた = 非衝突）。本文と HEAD 一致、検査 pass。

### qm-f2 — pass, high
読んだ: issue-56 / pr-57.md / pr-57.json / checks-57 / diff-57 / HEAD `src/list.sh` / listing-format.md L7-8 / cli-conventions.md L5-6。
形式誤り exit 2 + stderr、出力列不変。spec 3 条件。

### qm-f3 — pass, high
読んだ: issue-58 / pr-59.md / pr-59.json / checks-59 / diff-59 / HEAD `README.md` / `src/remind.sh` / cli-conventions.md L5。
docs のみ（R1）。記述は実装・規約に一致。

### qm-f4 — pass, high
読んだ: issue-80 / pr-81.md / pr-81.json / checks-81 / diff-81 / HEAD `tools/purge-archive`, `spec/purge_dry.spec.sh` / data-files.md / qm-adapter R0。
--dry-run は読むだけ、data/ 無変更、戻せない操作の実行を含まない。spec がファイル不変を確認。

### qm-g1 — pass（D1）, high
読んだ: issue-82 / pr-83.md / pr-83.json（spec, smoke SUCCESS、commit 後）/ checks-83 / diff-83 / HEAD `src/book.sh` L6 / data-files.md L5 / booking-rules.md L16 / qm-adapter §レーン hotfix。
実測: 無いファイルにヘッダ + 1 行、stderr 空。作成者 you ≠ qm-bot。『今日中』は判定に影響しない。

### qm-h1 — block（D2）, high
読んだ: pr-90.md（含まれる PR 4 件）/ pr-90.json（checks 3 本 11-18 pass）/ pr-84〜87.json（reviews）/ issue-89 / checks-90 / `git log release/2026-11-20` / release の `src/lib/slots.sh`。
#86 の reviews が [] → 記録の欠落 → 差し戻し。他 3 件は qm-bot APPROVED。独立 OK、検査 OK、slots.sh は正しい版。

### qm-h2 — pass（D2）, high
読んだ: pr-93.md / pr-93.json / pr-84〜87.json（4 件とも qm-bot APPROVED）/ issue-92（#88 / #91 を @po-lead が次回へ）/ checks-93 / `git log release/2026-11-20`。
記録 4/4、検査 3 本 pass（commit 後）、独立 OK。未了 2 件は異議として記録し承認。

### qm-s1 — block（smoke 完了まで承認しない）, medium
読んだ: checks-95（smoke pending）/ pr-95.json（smoke IN_PROGRESS）/ issue-94 / diff-95（g1 と同一）/ qm-adapter §レーン・§出荷判定。
必須検査未完了 → 承認しない。語彙の当て方だけ medium。内容は妥当。

## 読んだファイルの一覧（自己申告）

許可されたもののみ:
- `E:\Github\pit-crew\tmp\qm-rederive\INDEX.md`
- `E:\Github\pit-crew\tmp\qm-rederive\qm-*/task.md`（20 件）
- `E:\Github\pit-crew\tmp\qm-rederive\qm-*/repo/` 配下: `.claude/qm-adapter.md`, `.claude/dev-adapter.md`, `CLAUDE.md`, `README.md`, `.gitignore`, `docs/design/*.md`（4）, `docs/decisions/*.md`（4）, `docs/ops-log.md`, `src/**`, `spec/**`, `tools/*`, `data/*`, `.github-cache/*`（issue / pr .md / pr .json / checks / diff）。git 操作: `git log --all`, `git for-each-ref`, `git diff base...topic`, `git show <ref>:<path>`, `git ls-tree`, `git archive`（一時ディレクトリへ展開して `bash tools/check` を実行）、`git status --porcelain`（改変なしの確認）
- `E:\Github\pit-crew\experiments\qm\README.md`
- `experiments/qm/` の `ls` 出力（ファイル名のみ。禁止ファイルは開いていない）

禁止リスト（`experiments/qm/cells.mjs`・`verdicts.json`・`process-spec.json`・`author-notes.md`・`controls*`・`check-*.mjs`・`harm.mjs`・`gen-qm.mjs`・`repo.mjs`、`suites/qm/`、`docs/planning/26-*`、`docs/planning/27-*`、`docs/research/research-qm-review-role.md`、`subjects/`）は一切開いていない。
