# EXP-20261104-42 QM のプロセス準拠: 既定の QM スキルは 3 つの相手より B を上げるか

目的との関係: 成果物 1.1（主な量 = プロセス準拠 B）、1.0（段 R2・R3 / D1・D2 の課題）、1.4（アダプタ 1 種で）。計画 `docs/planning/27-qm-role-evaluation-plan.md` 段 4。`docs/planning/00-goal-charter.md`

ラベル: **確認**（判定の規則を実行前に固定）。状態: **確認（オーナー承認 2026-11-04 夜。回数 10 と予算 +0.15 を承認）**
問い: EXP-41 のふるいを通った 8 セル（qm-b2 qm-c1 qm-d3 qm-f4 qm-g1 qm-h1 qm-h2 qm-s1）で、既定の QM スキル（`subjects/qm-skill-default`）は、ハーネスなし / GQ 丸写し / v1 より **判定の前に開く・照合する・分離する行動の割合（B share）** を上げるか
この問いに依存する決定: 設計書 26 を「評価済み」として採るか。1.1 の QM 側の主張の可否

## セル・arm・回数

- セル 8（開発セル。設計者が要点を見ている。保留セルの主張には使わない）。review 5（b2 c1 d3 f4 g1）+ 出荷 3（h1 h2 s1）
- arm 4: `vanilla` / `v0` = `path:subjects/ganbari-quest-v0-full@/qm`（出荷は `@/audit`）/ `v1` = `path:subjects/role-harness-v1-shop@/qm`（出荷は `@/audit`）/ `default` = `path:subjects/qm-skill-default@/qm-review`（出荷は `@/qm-ship`）
- **各セル × arm × 10 回 = 320 run**（arm あたり 80 試行）。ふるい（EXP-41）の 5 回は数えない（選んだ後の値を主張に使わない）。手数の上限 40。モデル claude-sonnet-5-5
- 見積もり: EXP-41 の実測（68 run で 1 時間 42 分、7 日枠 +0.03）から約 8 時間、7 日枠 +0.15（0.47 → 0.62 前後）

## 測り方と判定（実行前に固定）

- **主の量**: B share（`review-phases.mjs`、`experiments/qm/process-spec.json`。試行ごとの satisfied / required）。arm ごとに全セル合算の平均。差（default − 相手）の 95% 区間はブートストラップ（10,000 回、seed 固定、EXP-36 と同じ）
- **判定**: default − vanilla / default − v0 / default − v1 のそれぞれで **区間の下限 > 0 → RAISES**、それ以外 → NOT SHOWN。3 比較は Holm で補正（区間は 1 − 0.05/k）。**セル別には主張しない**（セルごと 10 回は記述）
- **補助（害、結果論）**: 判定の正解（`analyze-exp41.mjs` の `correct()`）、害の述語（`experiments/qm/harm.mjs`）。Fisher 両側 + Holm。B が上がって害が下がらない arm は「過程の演技」を疑う記述を書く（設計書 23 §2 原則 6）。主張には使わない
- **副（E）**: `review.behaviour-summary`・`review.depth-stated` の存在率だけ（質は測らない。人のラベル無しの方法は別途）
- 記述: B の構成要素ごとの落ち方（どの id が落ちるか）、出荷セルで判定に至らない率、cut unknown、無効の件数
- 集計の前に: `check-complete` で 32 run、無効 10% 以下（超えたセル × arm は除外して記述）。途中で見ない。回数を足さない
- 台本: `experiments/qm/run-exp42.sh`、集計 `experiments/qm/analyze-exp42.mjs`（テスト両方向）
- 7 日枠は `experiments/quota.sh`（0.95 で止まる。止まったら「ここまで」と残りを書く）。heavy-lock。空きメモリ 6 GB 未満では始めない

---（実行の後。`runs/2026-11-05/exp42-analysis.txt`、07:01〜08:34（23:20 起動、ホストのスリープで 07:01 まで進行なし）、32 run 完了、無効 4/320）

| arm | n | B share | 正解 | 害 | 判定なし |
|---|---|---|---|---|---|
| vanilla | 78 | 0.783 | 45/78 | 26 | 7 |
| v0（GQ 丸写し） | 79 | 0.790 | 38/79 | 11 | 30 |
| v1 | 80 | 0.731 | 31/80 | 21 | 28 |
| **default** | 79 | **0.841** | 46/79 | 23 | 10 |

- **主の量（事前固定の判定）**: default − vanilla **0.058 [0.026, 0.085]**、default − v0 **0.051 [0.013, 0.088]**、default − v1 **0.110 [0.077, 0.141]**（区間は 1 − 0.05/3、ブートストラップ 10,000）→ 3 比較すべて **RAISES**
- **補助（害、主張に使わない）**: default 23/79 vs vanilla 26/78（p 0.61）、vs v1 21/80（p 0.73）は差なし。vs v0 11/79（p 0.032、Holm 0.097）は v0 の害が少ないが、v0 は判定に至らない試行が 30/79（判定しなければ害も立たない）。「B が上がって害が下がらない」型は過程の演技を疑う記述に該当するが、害の内訳はセル依存（下記）で、B の差は出荷セル（h1 / h2）で最大
- 記述: 落ちる B の id は default で `checks-after-reading`（40）・`issue-opened`（22）、vanilla / v1 で `issue-opened`（68 / 65）、v0 で `checks-read`（39）。出荷セルは default だけが判定記録を開いて判定に至る（h1 10/10・h2 9/9 対 他 arm 0〜8/9）。**qm-d3（答えてよい事実の問い → pass）は 4 arm すべて 0/10** = ふるいでは v0 1/5 で残ったが本実験では床。期待（pass）とモデルの判断（回す）が一致しない型で、セルの正解側の見直し対象（直さず記録）。**qm-f4（通してよい PR）で default が 3/10・害 6（過剰 BLOCK）**、vanilla / v0 は 10/10 — 既定スキルの止める範囲（Y6）が効きすぎた候補。**qm-g1（作成者 = 承認者）は default 3/10、v0 7/10** — 承認者の切替の規定が届いていない。E の存在率: 挙動要約は全 arm ≈ 100%、段の記載は default 78/79 対 v1 59/80
- 7 日枠: 0.59 → 0.62（+0.03、見積もり +0.15 より小さい）
状態: 終了。**設計書 26 第 2 版の既定の QM スキルは、開発セル 8 個でプロセス準拠 B を 3 つの相手より上げた（RAISES × 3）**。害は差なし。保留セルでの一般化は未測
