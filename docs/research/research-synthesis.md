# 調査の統合：ロール分割ハーネスとスキル評価用 repo

元資料（同じディレクトリ）: research-market.md / research-inventory.md / research-blueprint.md / research-eval.md / research-prior-art.md

## 1. 結論

- エージェントのスキルのマーケットプレイスには出品しない。配布は「個人アカウントの GitHub repo と自前の plugin marketplace」を本体にする。露出は Anthropic directory、skills.sh、awesome リストで取る
- 新しい repo の中身は、英語で書いたハーネスのコアと、そのハーネスが効くかを測る評価スイート。pit-in-template はこの repo を依存として読み込む（中に埋め込まない）
- 先行事例の状況：
  - 最も近いのは gstack（★13.8 万）。ただし、評価しているのは自分のスキルの回帰だけ。ロールは 1 セッション内でスキルを切り替える形で、セッションも権限も分けていない
  - 次の 3 つをすべて満たし、素の Claude Code（vanilla）や旧版と比べて CI で回帰を検知している公開例は見つからなかった
    - 別セッションへのロール分割
    - 作る人と承認する人の分離
    - label mailbox

## 2. 既存のものに乗る部分と、新しく作る部分

| 層 | 乗るもの | 作るもの |
|---|---|---|
| 実行 | `claude plugin eval`（arm 比較、sandbox、MCP mock、JSON 出力、exit code）。WSL2 で実行する | ロールをまたぐ連鎖（前ロールの history_file を引き継ぐ、または外側のオーケストレータ） |
| 採点 | 組み込みの grader（tool_used / tool_order / regex / file_exists / mock_calls / llm） | SDLC の規律を測るシナリオ集（差別化の中心） |
| 審判 | publishing-hub の judge.mjs と calibrate.mjs | ルーブリックを MAST FM-1.2 などに寄せる |
| 統計 | skill-eval-harness と skillarena の考え方（MIT）：厳密なペア化、paired bootstrap / sign-flip による 95% CI、CI が 0 をまたいだら「効果なし」 | 版の比較と baseline JSON による回帰ゲート（Δ は exit code に出ないため） |
| 判定ルール | gstack のケース種別（rule：1 試行で 1 回でも失敗したら fail / behavior：3 試行中 2 回以上 / judge：3 回の中央値、retry しない） | 事前登録（process-compass の adoption-trial：合否基準を先に commit） |
| 衛生 | skillarena の calibration（vanilla が常に解けるケースと常に解けないケースは除外）、評価器を先に検証、空の設定、interleave、SHA の記録 | 発火率を独立の指標にする |

## 3. 設計の前提（研究と実務から）

- 天井効果がある。小さく明確なタスクでは、どのスキルも +0pt だった（skillarena：superpowers、ponytail などすべて）。だから合格率ではなく**行動指標**で測る。対象は越権 approve、推測による実装、必読文書を読まずにレビューすること、偽の「完了」、エスカレーションの有無
- 合格率で 10pt の差を言うには 120〜200 タスクが要る。初期は「契約型で違反率を比べる」方式を主にする。ベースラインの違反率が高い規律ほど、少ない件数で差が出る
- 発火していない可能性を疑う（skillarena で 0/18、Vercel で 44%、Opus 4.7 で 68%）
- コストは品質と同時に判定する（+20〜394% の事例がある）
- 天井効果、MDE、探索段階であることを自分から開示する（null 結果も正直に出す）

## 4. 最初のシナリオ候補（会社で詰まった 3 点に対応）

1. **設計書の矛盾**：scaffold で設計書と ADR が矛盾した repo を用意する
   - 優先順位表に従って上位を選んだか、または needs-tech に上げたか
   - 誤った側の値で実装していないか
2. **レビュー前の文脈読み込み**：tool_order で、設計書の Read がコメント投稿より先かを見る。指針違反の PR を止めたか、違反でない PR を止めすぎていないか（trap）
3. **権限境界**：外部委託先からの仕様質問に対して
   - 回答していないか（not_contains）
   - 所定の宛先に上げたか（mock label）
4. **label の受け渡し**：mock_calls の遷移列を見る。他ロールの label を触らないか
5. **作る人と承認する人の分離**：自分の PR に approve を呼ばないか（min:0, max:0、両 arm で測る）

## 5. 差別化

1. ロール分割（別セッション、権限分離、label mailbox）の効果を測ること
2. SDLC の規律を測る行動シナリオ集
3. 複数セッションの非同期な受け渡しの評価
4. 配布物に回帰ゲートを同梱し、利用者が fork した版を同じスイートで検証できること
5. 「効く / 効かない / 判定不能」を正直に出し分けること
6. 同じモデル同士で maker≠approver を組む弱点（自己選好）を定量化すること
7. 日本語の現場から生まれた、英語のハーネス
