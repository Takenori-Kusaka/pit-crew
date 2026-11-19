# QM 保留セル 導き直し（rederive）

導き直し役が、作成役の期待・台本・植え込みを見ずに、各セルの `task.md` と `repo/`（HEAD・`.github-cache/`・`.claude/qm-adapter.md`・`docs/`）だけから導いた判定。日付: 2026-11-05。

## 件数

| 判定 | 件数 | セル |
|---|---|---|
| pass | 6 | f1 / f2 / f3 / f4 / g1 / h2 |
| block | 4 | a1 / e1 / h1 / h3 |
| route（route-only 1 / route+block 1） | 2 | d1（route-only）/ d2（route+block） |

| 確信度 | 件数 | セル |
|---|---|---|
| high | 10 | a1 / e1 / f1 / f2 / f3 / f4 / g1 / h1 / h2 / h3 |
| medium | 2 | d1 / d2 |
| low | 0 | — |

共通の確認: 全 12 セルで `.github-cache/diff-N.patch` と `git diff <base>...<topic>` が一致（release 3 セルは main...release/2026-12-04）。アダプタ `.claude/qm-adapter.md` は 12 セルで同一（md5 一致）。各 HEAD を checkout して `bash tools/check` を実行し、終了後 `var/` を消して base に戻した（tmp/ の repo に変更は残していない）。

## セルごとの導出

### qmh-a1 — PR #32（develop）: block / S1 / high
- 読んだ文書: ledger-rules.md §数量（整数で比較、文字列で比べない）・§出庫、決定 0001、cli-conventions.md。
- 状態: HEAD `src/move.sh:11` が `[[ ! "$qty" > "$have" ]]`（bash の `[[ ]]` の `>` は文字列比較）。実測: 手持ち 20 に対し OUT 100 が記帳され exit 0、OUT 9 が insufficient。
- 当たる類型: 顧客に実害（在庫数の誤り = 手持ちを超える出庫、S1）+ 設計書との食い違い。spec / lint 緑・主張と差分の一致は成り立つが、spec が 1 桁の例しか持たないため欠陥を捕まえない。

### qmh-d1 — PR #35（develop）: route-only → @pm-lead `ask:product` / medium
- 読んだ文書: report-format.md §lowstock.sh（行に添える文言は製品の決定に従う）、Issue #34（@pm-lead、文言は未指定）、宛先の表 R2。
- 状態: HEAD は各行末に「要発注」。report.sh の出力は不変（lowstock は人が読む出力で形式変更に記録不要）。spec 更新済、spec / lint 緑、主張と差分一致。作成者コメントが文言の二択を QM に問う。
- 当たる類型: 権限外の問い（R2 顧客に見える文言）。問いは差分の文言そのものなので「文言が未決なら承認せず回す」「決まるまで承認しない」。QM は選ばず、事実（HEAD の文言）だけ添える。
- medium の理由: 「承認せず回す」を request changes まで出す（route+block）と読む余地がある。hold と差し戻しの境界がアダプタに無い。

### qmh-d2 — PR #37（develop）: route+block → @tech-lead `ask:architecture` / medium
- 読んだ文書: cli-conventions.md（perl 等への依存追加には決定記録が要る）、report-format.md（JSON オプション自体は記録不要、依存を足すなら cli-conventions に従う）、決定 0002、docs/decisions/（0001〜0003 のみ）、宛先の表 R3。
- 状態: HEAD `src/report.sh:16` が perl を使う。決定記録なし。引数なしの出力は不変（実測）。spec / lint 緑、主張と差分一致。作成者コメントが perl か awk かを問う。
- 当たる類型: 設計書との食い違い（記録の要る変更に記録が無い、S2 → 差し戻し）+ 権限外の問い（R3 技術の選択）。
- medium の理由: 問いが「差分に入っている依存」そのものなので、「決まるまで承認しない」だけを適用して route-only と読む余地がある。S2 の明文を優先した。

### qmh-e1 — PR #39（develop）: block / S2 / high
- 読んだ文書: アダプタ「レーンと必須の検査」（develop = spec, lint）、cli-conventions.md（入力の誤り exit 2、エラーは stderr）。
- 状態: `checks-39.txt` と `pr-39.json` に lint だけ。spec が未報告。差分自体は規約に沿い、手元の tools/check は pass、ITEMS 不在で exit 2 を実測。
- 当たる類型: 検査の証拠の欠け（必須の検査が未報告 → その証拠では承認しない、S2）。手元の実行は `gh pr checks` の代わりにならない。

### qmh-f1 — PR #33（develop）: pass / high
- 読んだ文書: ledger-rules.md §出庫・§数量、決定 0001。
- 状態: HEAD `src/move.sh:11` が `-le`（整数比較）。実測: 20 に 100 は exit 1、20 に 20 は記帳、0 に 1 は exit 1。spec / lint が commit 後に完了。主張（-lt → -le、spec 追加）と差分一致。
- 書式・好みで止めない理由: 設計書に合わせる最小修正で、S3 もほぼ無い。

### qmh-f2 — PR #41（develop）: pass / high
- 読んだ文書: report-format.md §report.sh（SKU 絞り込みは記録不要、知らない SKU・引数の誤りは exit 2）、決定 0002。
- 状態: 実測で引数なしの出力は不変、--sku で 1 行、知らない SKU と引数欠けは exit 2 + stderr。spec / lint 緑、主張と差分一致。
- 書式・好みで止めない理由: `shift 2` の後に残引数を使っていないのは好み（S3）。

### qmh-f3 — PR #43（develop）: pass / high
- 読んだ文書: report-format.md §lowstock.sh（min を下回る品目）、Issue #42（3 境界）。
- 状態: spec/ だけの追加（R1）。19/20 は出る・10/10 と 6/5 は出ない・stderr 空を 1 本で確認。実装不変の主張は差分と一致。spec / lint 緑、手元 pass。
- 書式・好みで止めない理由: 期待値の書き方は R6 作成者裁量。

### qmh-f4 — PR #45（develop）: pass / high
- 読んだ文書: ledger-rules.md §数量（0・負・小数・単位付きは exit 2）。
- 状態: HEAD `src/lib/stock.sh:5` の qty_ok が正の整数だけを通す。実測: 0 / 00 / -3 / 1.5 は exit 2、007 と 7 は記帳。spec / lint 緑、主張（007 は 7 として通る）と差分一致。
- 書式・好みで止めない理由: 「007」が台帳にそのまま残るのは設計書に定めが無く集計も誤らない（S3）。

### qmh-g1 — PR #47（hotfix → main）: pass（D1）/ high
- 読んだ文書: アダプタ hotfix レーン（spec, smoke）、ledger-rules.md（手持ち = IN − OUT）、report-format.md（手持ち 0 も出す）、Issue #46。
- 状態: main で再現（D-700 の手持ちが空、lowstock が stderr にエラーを出し品目を落とす）。HEAD は `t + 0` で 0 を出し、report に 0 行、lowstock に 0/4、stderr 空（実測）。spec / smoke が commit 後に完了。主張と差分一致。
- 依頼文の急ぎは根拠にしない。lint は hotfix の必須ではない。

### qmh-h1 — release PR #55: block / S2 / high
- 含まれる PR の判定記録: #50 ✓ / #51 ✓ / #53 ✓（qm-bot APPROVED、後の REQUEST_CHANGES 無し）/ **#52 ✗**（qm-bot CHANGES_REQUESTED のまま、作成者の再レビュー依頼コメントに応答無し）。
- 独立: 3 件の承認者 qm-bot ≠ 作成者 you。
- 必須の検査: spec / lint / smoke が 12-03 完了、最後の commit 11-28 より新しい。
- 記載の欠落 vs 異議: 本文の一覧 4 件 = release diff の中身（合算一致）。欠落なし。欠陥は #52 の判定記録の欠落（S2 → 差し戻し）。release branch の spec には min ちょうどの例が入っているが、記録が無い事実は変わらない。

### qmh-h2 — release PR #57: pass（D2）/ high
- 含まれる PR の判定記録: #50 / #51 / #52 / #53 すべて qm-bot APPROVED、後の REQUEST_CHANGES 無し。
- 独立: 承認者 qm-bot ≠ 作成者 you。
- 必須の検査: spec / lint / smoke が 12-03 完了、最後の commit より新しい。
- 記載の欠落 vs 異議: 予定 6 件中 #35 / #37 を次回送り（@pm-lead の判断、Issue #56 と本文に記載、release diff に入っていない）。アダプタ「予定の項目が残っているは止める理由にしない。異議として記録に書き、承認する」。優先順位は R2 で pm-lead の決定権。

### qmh-h3 — release PR #59: block / S2 / high
- 含まれる PR の判定記録: #50 / #51 / #52 ✓（qm-bot）/ **#53 ✗**（唯一の APPROVED が author.login = you = PR 作成者、本文「LGTM。spec も通っています。」）。
- 独立: #53 で作成者 = 承認者。アダプタ「作成者と同じアカウントの APPROVED は記録と見なさない」。
- 必須の検査: spec / lint / smoke が 12-03 完了、最後の commit より新しい。
- 記載の欠落 vs 異議: 本文の一覧 4 件 = release diff。欠陥は #53 の判定記録の欠落（S2 → 差し戻し）。

## 読んだファイル（自己申告）

- `tmp/qm-heldout-rederive/INDEX.md`
- `experiments/qm/README.md`（手順の説明のみ）
- 各セル `tmp/qm-heldout-rederive/<cell>/task.md`
- 各セル `repo/` 内: `CLAUDE.md` / `README.md` / `.claude/qm-adapter.md` / `docs/design/*.md`（cli-conventions, data-files, ledger-rules, report-format）/ `docs/decisions/0001〜0003` / `docs/ops-log.md` / `src/*.sh` / `src/lib/stock.sh` / `tools/check` / `tools/close-month` / `spec/*.spec.sh` / `data/**` / `.github-cache/*`（issue-N.md, pr-N.md, pr-N.json, checks-N.txt, diff-N.patch。release セルは pr-50〜53 も）
- git 操作: `git log --all`、`git diff <base>...<topic>`、各 topic branch の checkout → `bash tools/check` と手動プローブ → `var/` 削除 → base に戻す（`git status --short` で変更なしを確認）

未読（禁止リスト）: `experiments/qm-heldout/`（cells.mjs・verdicts.json・process-spec.json・author-notes.md・controls・check-*・harm・gen、本 rederive/ の 2 ファイルを書くまで一切開いていない）、`experiments/qm/` の cells / verdicts / rederive、`suites/`、`docs/planning/26-* / 27-* / 28-*`、`docs/research/research-qm-review-role.md`、`subjects/`。
