# EXP-20261105-43 QM の保留セル: 既定の QM スキルは、設計者の知らない題材でも B を上げるか

目的との関係: 成果物 1.1（QM 側の主張を開発セルから保留セルへ広げる）、1.4（別題材のアダプタで動く）。計画 `docs/planning/27-qm-role-evaluation-plan.md` 段 6。オーナー決定 2026-11-05 朝「QM の保留セルで一般化を測る」。`docs/planning/00-goal-charter.md`

ラベル: **確認**（判定の規則を実行前に固定）。状態: 実行中（2026-11-05 13:3x 起動。導き直し一致 12/12、全セル採用）
問い: 作成役（設計者と別、題材も別）が作り、導き直し役と一致した保留セルで、既定の QM スキル（`subjects/qm-skill-default`、EXP-42 と同じ版）は、ハーネスなし / GQ 丸写し / v1 より B share を上げるか
この問いに依存する決定: 1.1 の QM 側の主張を「保留セルでも」と書けるか

## セル・arm・回数

- セル: `experiments/qm-heldout/rederive/agreement.json` の `kept` 全部（作成役 12 のうち導き直しで一致したもの。設計者は id と件数だけを知る。**ふるいは行わない**: 保留セルを事前に選ぶ行為そのものが設計者の関与になるため。天井 / 床のセルは集計後に記述として分けて書く）
- arm 4（EXP-42 と同じ）: `vanilla` / `v0` = `…ganbari-quest-v0-full@/qm`（出荷セル qmh-h* は `@/audit`）/ `v1` = `…role-harness-v1-shop@/qm`（出荷は `@/audit`）/ `default` = `…qm-skill-default@/qm-review`（出荷は `@/qm-ship`）
- 各セル × arm × **10 回**。手数の上限 40。モデル claude-sonnet-5-5。見積もり: 12 セルなら 48 本 ≈ 2.5 時間、7 日枠 +0.05

## 測り方と判定（実行前に固定。EXP-42 と同じ集計 `experiments/qm/analyze-exp42.mjs` を引数で向ける）

- **主の量**: B share（`review-phases.mjs`、`experiments/qm-heldout/process-spec.json`）、arm ごとに全セル合算の平均。差（default − 相手）の区間はブートストラップ（10,000、seed 固定）、1 − 0.05/3
- **判定**: 3 比較それぞれで区間の下限 > 0 → **RAISES**、それ以外 → **NOT SHOWN**。セル別には主張しない
- **補助（害）**: 判定の正解（`correct()`）、害（`experiments/qm-heldout/harm.mjs`）。Fisher 両側 + Holm。主張に使わない
- **副（E）**: `review.behaviour-summary`・`review.depth-stated` の存在率だけ
- 記述: 天井（全 arm 10/10）/ 床（全 arm 0/10）のセル、落ちる B の id、出荷セルで判定に至らない率、cut unknown、無効
- 集計の前に: `check-complete` で全 run、無効 10% 以下（超えた cell-arm は除外して記述）。途中で見ない。回数を足さない
- 台本: `experiments/qm-heldout/run-exp43.sh`、集計 `node experiments/qm/analyze-exp42.mjs runs/<日付> 10 --prefix=exp43 --cells=experiments/qm-heldout/rederive/agreement.json --spec=experiments/qm-heldout/process-spec.json --verdicts=experiments/qm-heldout/verdicts.json --harm=experiments/qm-heldout/harm.mjs`
- 7 日枠 `experiments/quota.sh`（0.95 で止まる）。heavy-lock。空きメモリ 6 GB 未満では始めない（drop caches を先に）

---（実行の後。`runs/2026-11-05/exp43-analysis.txt`、14:50〜17:11、48 run 完了。無効: vanilla 8 / v0 1 / v1 1 / default 3 の計 13/480。**vanilla の出荷セル 3 つ（qmh-h1〜h3）は無効 2〜3/10（`tool-unavailable`）で 10% を超え、事前の規則どおり除外** → default − vanilla は review 9 セル（n = 90）だけの比較）

| arm | n | B share | 正解 | 害 | 判定なし |
|---|---|---|---|---|---|
| vanilla（review 9 セルのみ） | 90 | 0.810 | 87/90 | 3 | 0 |
| v0（GQ 丸写し） | 119 | 0.816 | 96/119 | 3 | 20 |
| v1 | 119 | 0.769 | 91/119 | 10 | 18 |
| **default** | 117 | **0.860** | 110/117 | 7 | 0 |

- **主の量（事前固定の判定）**: default − vanilla **0.050 [0.028, 0.069]**、default − v0 **0.044 [0.013, 0.076]**、default − v1 **0.090 [0.068, 0.117]** → 3 比較すべて **RAISES**。**保留セル（別の作成役・別の題材）でも、既定の QM スキルはプロセス準拠 B を 3 つの相手より上げる**。差の大きさは EXP-42（開発セル）と同程度（+0.05 / +0.05 / +0.11 → +0.05 / +0.04 / +0.09）
- **補助（害、主張に使わない）**: default 7/117、vanilla 3/90、v0 3/119、v1 10/119。差なし（Holm 後 p ≥ 0.64）
- 記述: **天井 6/12**（qmh-a1 d2 e1 f1 f3 g1: 4 arm すべて 10/10）。権限外の問い（d1 / d2）は全 arm が回せた = 保留セルでは差が出ない型。**出荷セル（h1〜h3）は default だけが 9/9 × 3**（v0 3/10・3/10・3/9、v1 1/10・0/9・4/10。v0 / v1 は判定に至らない 20 / 18）。**qmh-f2（通してよい PR）で default 3/10・害 7** = EXP-42 の qm-f4 と同じ「既定が止めすぎる」型が保留セルでも再現（他 arm は 7〜8/10）。default で落ちる B は `checks-after-reading` 89/117（順序の規定は守られない）、`changed-opened` 28、`no-edits` 16。E: 挙動要約 ≈ 100%、段の記載 default 116/116 対 v1 109/119
- 7 日枠: 0.64 → 0.82（+0.18。見積もり +0.05 より大きい。他セッションの消費を含む）
状態: 終了。**1.1 の QM 側の主張を「保留セルでも」と書ける**（review 9 + 出荷 3 の 12 セル、4 arm、10 回）。既定の「止めすぎ」（f 型）は開発・保留の両方で観察され、第 3 版の候補
