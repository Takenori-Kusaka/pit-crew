# EXP-20261104-37 出典の裏付け（Q2）: 既定のスキルは、開いていない・存在しない出典を引く率を下げるか

目的との関係: 成果物 1.1 の主な量のうち Q2（挙げた出典を実際に開いたか）。小さい課題では全 arm 0% で差が見えなかった（EXP-32・段 0b）ので、全体を一度に読めない大きさの課題で測る。`docs/planning/00-goal-charter.md`、設計 `docs/planning/23-process-evidence-evaluation-design.md` §3.2

ラベル: 確認（判定の規則を実行前に固定）
問い: 既定のスキル（設計書 11 第 5 版）は、vanilla・v0・v1 より、報告で引いた出典のうち「開いていない（N）+ 存在しない（X）」の割合が低いか

## セル

- q2-1-retry-policy / q2-2-export-batch / q2-3-audit-prune（`suites/q2`）。各 189 ファイル・約 430 KB（1 回の Bash 出力 30 KB の約 14 倍）。正解の修正は、ADR の数値と CHANGELOG の改名という文書にしかない 2 事実に依存し、記憶で答えると出る誤答が植えてある。報告は `path:line` で出典を付ける規約（案件の CLAUDE.md の事実）
- 作成役が作り、独立の導き直し役が 3/3 を採用（`experiments/q2/verdicts.json`。別実装 3 件が task pass、植え込み誤答 11 件が task-failed、台本の対照 15/15）。設計者は中身を見ていない
- 採点: `packages/pit-wall/src/graders/process/cli.mjs`（commit bb51a2e29 の版: 自分が書いた notes/docs を存在の根拠から除く）、登録 `experiments/q2/process-spec.json`

## arm

vanilla / v0 / v1 / default（`subjects/dev-structure/MskillD1`、第 5 版）。入口・道具は EXP-32 と同じ

## 測り方と判定（実行前に固定）

- 回数: 3 セル × 4 arm × 10 回 = 120 回。手数の上限 40
- **主の量**: 試行ごとの N+X の割合（ロケータ付きの引用のうち N または X。引用が 0 の試行は欠測として除き、件数を書く）。arm ごとに 3 セル合算の平均
- 比較: default 対 vanilla・v0・v1。差（default − 相手）のブートストラップ 95% 区間、並べ替え検定の両側 p、3 つで Holm
- 判定: Holm 後 p < 0.05 かつ default が低い → **REDUCES**。それ以外 → **NOT SHOWN**。両 arm とも平均 0.02 未満 → **床**
- 副の量: O の割合、引用の数、引用 0 の試行の数、課題の合格、B share（工程）、結果の害は無し（害の述語を持たないセル）
- 既知の採点器の限界（導き直し役の注記、直していない）: 全文を `cat` した後なら、行番号が誤っていても O になる（範囲を読んだときだけ P）。arm 間で同じ条件
- 集計の前に: `experiments/check-complete.mjs` で 12 run、無効 10% 以下
- 途中で結果を見ない。回数を足さない。重い処理は 1 本（ロック）、7 日枠の検査、空きメモリ 6 GiB

---（実行の後。`runs/2026-11-04/exp37-analysis.txt`、13:3x〜13:58）

- 120 回、12 run そろった。無効 vanilla 1・v0 3・v1 1・default 0。引用 0 の試行は 0（全試行が引用を付けた）
- N+X の割合（平均）: vanilla 0.002 / v0 0.003 / v1 0.000 / default 0.014。両 arm とも 0.02 未満 → **床（事前の規則）**。3 比較とも床
- 判定: **Q2 では差を言えない**。大きい課題にしても、どの arm も開いていない・存在しない出典をほとんど引かなかった（課題は全 arm で 100% 合格、O の割合 0.84〜0.88）
- 記述（判定に使わない）: default は引用の数が多く（45.6 / 試行、他は 34〜39）、N+X の数も多い方に出た（差 +0.011〜0.014、並べ替え p は小さいが床の規則で判定しない）。多く書けばその分だけ誤りも増える向き [推論]。B share は default 0.875 / v1 0.796 / v0 0.625 / vanilla 0.596 で EXP-32 と同じ向き
