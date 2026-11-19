# judge モデル調査（pit-wall の LLM judge 選定）

調査日: 2026-10-31 / 調査者: Claude（web 調査のみ。何もインストールしていない）
対象: エージェントの軌跡（実行コマンド・編集・最終返答）を二値ルーブリックで採点する judge の選定
前提: 追加の支出なし（ホスト機と GitHub Actions だけ）／Claude を使えない企業利用者がいる／商用利用の可否をライセンスで確認する

凡例: **[未検証]** = 一次情報（モデルカード・論文本文）で確認していない。VRAM は特記がない限り「Q4 量子化時の目安」を筆者が推定した値で、すべて [未検証]。

---

## 1. 結論（先に）

- 専用 judge モデルの多くは **最終返答だけ（または応答 1 つ）を採点する前提**で訓練されている。文脈長も 8k 程度のものが多い。pit-wall が必要とする **軌跡全体の判定** を前提にした、商用利用できるオープン judge は見つからなかった。
- 軌跡の判定では「どの judge を使うか」より **「judge に何を見せ、何を指示するか」** の効果が大きい。outcome-only の judge は、返答に現れない失敗を検出できていないのに、recall の数字だけは高く出る（trajectory-judge, arXiv:2609.00038）。pit-wall で起きた「最終返答だけを見て steering コメントを見落とした誤 PASS」は、この論文の主張と同じ形をしている。
- 最初に陪審員として試す候補は、**① gpt-oss-20b または Qwen3（汎用・Apache 2.0・長文脈）、② CompassJudger-2-7B（専用 judge・Apache 2.0）、③ Flow-Judge-v0.1（3.8B・Apache 2.0・pass/fail を出力できる）** の 3 つ。ただし ③ は軌跡を短い区間に分けて渡す場合に限る。
- Claude の judge で Claude のエージェントを採点すると、**自己選好バイアス**がかかる恐れがある。別系統のオープンモデルを陪審員に入れるのは、コストを抑えるためだけでなく、このバイアスを打ち消すためでもある。

---

## 2. 専用 judge・評価・報酬モデル一覧

### 2.1 比較表

| モデル | 提供元 | サイズ / ベース | 重み | ライセンス（商用） | 入力形式 | 出力 | 主張するベンチマーク（独立再現） | ローカル実行 | 最終更新 |
|---|---|---|---|---|---|---|---|---|---|
| Selene-1-Mini-Llama-3.1-8B | Atla | 8B / Llama-3.1-8B | 公開 | カード上は apache-2.0。ただし Llama 3.1 の派生物なので Llama 3.1 Community License も適用されうる（要法務確認）[未検証] | 絶対評価・分類・pairwise | 批評 + 判定 | RewardBench で 8B 生成型モデルの 1 位、GPT-4o を上回ると主張。独立再現は [未検証] | 量子化版 14 種（llama.cpp / Ollama / LM Studio）。約 6GB | コレクションの更新は 3 月 2 日（年は不明） |
| Selene 1（大） | Atla | 非公開 | API のみ | 有料 API（2025 年時点で $3/1K 呼び出し）→ 予算条件で対象外 | 同上 | 同上 | — | 不可 | — |
| Flow-Judge-v0.1 | Flow AI | 3.8B / Phi-3.5-mini | 公開（GGUF / AWQ あり） | **Apache 2.0（商用可）**。Phi-3.5 は MIT | ユーザー定義ルーブリック（pass/fail、3 段階、5 段階 Likert） | `<feedback>` + `<score>` | 自社の held-out テストで pass/fail F1 0.955。独立再現は [未検証] | 4GB 以上（公式）。AWQ 版は 2.3GB | 2024 年 9 月以降の更新は [未検証] |
| Glider | Patronus | 3.8B / Phi-3.5-mini | 公開 | **CC-BY-NC-4.0（商用不可）** | 任意個の入出力、会話、RAG | 推論 + 重要語のハイライト + 整数スコア | 論文 arXiv:2412.14140 | 約 3GB | 2024 年 12 月 |
| Lynx 8B / 70B | Patronus | Llama-3 | 公開 | 70B は **CC-BY-NC-4.0（商用不可）**。8B は [未検証] | RAG のハルシネーション検出 | PASS/FAIL + 推論 | HaluBench 87.4%（70B） | 8B は約 6GB | 2024 年 7 月 |
| Prometheus 2（7B / 8x7B） | KAIST ほか | Mistral-7B / Mixtral | 公開 | メタデータは apache-2.0。ただしカードに「学習データは OpenAI 利用規約に服する」とあり、**商用利用には注意が要る** | 絶対評価（ルーブリック + 参照解答）/ 相対評価（A/B） | 批評 + `[RESULT]` 1〜5 または A/B | 論文 arXiv:2405.01535 | 7B は約 5GB | 2024 年 |
| CompassJudger-2（7B / 32B） | OpenCompass（上海 AI Lab） | Qwen2.5-Instruct | 公開 | **Apache 2.0（商用可）**。Qwen2.5-7B / 32B 本体も Apache 2.0 [未検証] | 汎用 judge（pointwise / pairwise）、検証可能報酬で訓練 | 批評 + 判定 | JudgerBenchV2 で 7B は 60.52、32B は 62.21（自作のベンチ） | 7B は約 5GB、32B は約 20GB | 2025 年 7 月 |
| Skywork-Reward-V2（0.6B〜8B） | Skywork | Qwen3 / Llama 3.x | 公開 | **Qwen3 版は Apache 2.0**。Llama 版は Llama 3.1 / 3.2 Community License | 会話（Bradley-Terry 型の報酬モデル） | スカラー報酬（批評なし） | 8B（Llama）で RewardBench v1 96.4、RM-Bench 92.8、JudgeBench 80.0 | 0.6B〜8B | 2025 年 7 月 |
| Skywork-Critic-Llama-3.1（8B / 70B） | Skywork | Llama-3.1 | 公開 | 「other」と表記。Llama 3.1 と Skywork の独自規約 [未検証] | pairwise | A/B | JudgeBench に掲載あり | 8B は約 6GB | 2024 年 9 月 |
| Qwen3-Nemotron-32B-GenRM-Principle | NVIDIA | Qwen3-32B | 公開 | NVIDIA Open Model License（商用可）[未検証] | 複数ターンの会話 + **ユーザー定義の原則**（Yes/No logit） | float 報酬 | JudgeBench 81.4、RM-Bench 86.2（2025 年 9 月の自己申告） | BF16 で 80GB GPU（公式）。Q4 で約 20GB [未検証] | 2025 年 10 月 27 日 |
| Llama-3.3-Nemotron-Super-49B-GenRM-Multilingual | NVIDIA | Llama 3.3 | 公開 | NVIDIA Open Model License + Llama 3.3 | 単一応答 / pairwise | 報酬 | — | 約 30GB | 2025 年 |
| Nemotron 3 Ultra GenRM（550B） | NVIDIA | — | 公開 | OpenMDW 1.1。情報源は第三者のミラーのみ [未検証] | — | — | — | ローカルでは実行できない | 2026 年 6 月 [未検証] |
| RootSignals-Judge-Llama-70B（Root Judge） | Root Signals | Llama-3.3-70B | 公開（FP8） | **Llama 3.3 Community License**（商用可。月間アクティブ 7 億人の上限と表示義務あり） | OpenAI 互換のチャット、カスタムルーブリック、64k 文脈 | JSON（REASONING, VERDICT=PASS/FAIL） | HaluBench 86.3% | 80〜96GB（公式） | 2025 年 1 月ごろ |
| JudgeLM（7B / 13B / 33B） | BAAI | Vicuna / LLaMA | 公開 | **非商用**（7B のカード） | pairwise（参照解答あり / なし） | スコア + 理由 | 2023 年 | 約 5GB〜 | 2023 年 |
| Auto-J 13B | GAIR | Llama-2-13B | 公開 | Llama 2 系 [未検証] | pairwise / 単一応答 + 批評 | 批評 + 判定 | 2023 年 | 約 8GB | 2023 年（古い） |
| Self-Taught Evaluator / J1 | Meta | Llama-3.x / Qwen3（8B〜70B） | 重みの公開は [未検証] | — | pairwise（推論してから判定） | 判定 | Self-Taught は RewardBench 88.3 | — | 2024〜2025 年 |
| Llama Guard 4 | Meta | 12B | 公開 | Llama 4 Community License [未検証] | 安全性の分類（入力 / 出力） | safe/unsafe + カテゴリ | — | 約 8GB | 2025 年 |
| FLAMe | Google | PaLM-2 系 | **非公開**（論文のみ。公開情報は見つからなかった）[未検証] | — | 102 タスクの autorater | — | RewardBench など 12 中 8 で優位と主張 | — | 2024 年 7 月 |
| Galileo Luna | Galileo | 小型の評価専用モデル（EFM） | 非公開（SaaS） | 商用 SaaS → 対象外 | RAG・ハルシネーション | — | ベンダーの主張のみ | 不可 | 2024 年 6 月 |
| OpenAI Evals graders | OpenAI | — | API | 従量課金 → 対象外。公式ドキュメントに graders の deprecation 告知あり | score_model / label_model / string_check / python | 数値 / ラベル / 0-1 | — | 不可 | 2026 年 |
| Anthropic | Anthropic | — | — | **専用の grader モデルは見当たらない**（Console の eval ツールで汎用 Claude を使う）[未検証] | — | — | — | — | — |

### 2.2 補足

- **専用 judge の多くは「1 つの応答」を評価する前提**で作られている。Flow-Judge / Glider / Selene Mini は文脈長が実質 8k 程度で、軌跡をそのまま渡すと切り捨てられる（Selene Mini の文脈長は [未検証]）。軌跡に強いのは、長文脈の汎用モデル（Qwen3、gpt-oss）か Root Judge（64k）。
- **報酬モデル（Skywork-Reward-V2、Nemotron GenRM）は批評を出さない**。スカラー値か Yes/No の logit しか返さないので、PASS/FAIL の理由を人が監査できない。ただし Nemotron の「原則を与えて Yes/No の logit を見る」方式は二値ルーブリックとの相性がよい。
- **Llama 派生のモデル**は、カードに apache-2.0 と書かれていても、ベースの Llama Community License（月間アクティブ 7 億人の上限・表示義務）を引き継ぐ。企業に配布する前に法務確認が要る。Apache 2.0 だけで済む候補は、Flow-Judge、CompassJudger-2、Skywork-Reward-V2 の Qwen3 版、Qwen3、gpt-oss。
- **汎用のオープンモデルを judge に使う**選択肢もある。gpt-oss-20b は Apache 2.0・21B の MoE で、MXFP4 なら 16GB に収まり、文脈長は 131k（2025 年 8 月公開）。Qwen3 は 8B / 14B / 32B が Apache 2.0 [未検証]。trajectory-judge 論文は、qwen2.5:14b を Ollama で動かして「各ステップを確認せよ」と指示すると、返答に現れない失敗を完全に分離できたと報告している。小型の専用 judge より、**中型の汎用モデルに良いプロンプトを与える方が軌跡の判定には効く可能性が高い**。
- **軌跡の judge は、学習済みモデルとしてはほぼ存在しない**。研究の中心は「LLM judge を軌跡に当てたときの評価方法」で、次のような研究がある。
  - Agent-as-a-Judge（Zhuge ほか、DevAI 55 タスク）: 人間の合意との一致率が gray-box 92% / black-box 90%、LLM-as-a-judge は 70% / 60%（二次情報経由で取得 [未検証]）
  - AgentRewardBench（arXiv:2504.08942）: Web エージェントの軌跡 1302 本。成功・副作用・無駄な反復の 3 軸で専門家がラベル付け。ルールベースの評価は、正しい軌跡を多く棄却していた
  - Counsel（arXiv:2606.21627、2026 年 6 月、CC BY 4.0）: tau-bench と DA-Code の過程に対する批評の meta-eval。最良の judge でも、誤りの位置の一致率は約 88%、理由の質の一致率は約 65%
  - TIR-Judge（arXiv:2510.23038）/ AgentRM（ACL 2025）/ JudgePanel（arXiv:2608.29168）: 重みの公開状況は [未検証]
- **ライブラリ側**:
  - Arize Phoenix evals は **Elastic License 2.0**（自社の評価に使う分には概ね問題ない。第三者にホスト型サービスとして提供するのは禁止）
  - Haize Labs Verdict / TypeSafe（typesafe-ai）は、今回の検索では一次情報に到達できなかった [未検証]

---

## 3. judge を信頼して使うための定石（出典付き）

> 本節で挙げる論文の arXiv 番号のうち、§2 で本文を確認したもの以外は、記憶から書いたもので本セッションでは再取得していない [未検証:ID]。

1. **人手ラベルで校正し、κ で報告する。** 一致率（%）は偶然の一致とクラスの偏りに引きずられる。Cohen の κ（陪審員が 3 人以上なら Fleiss の κ、Krippendorff の α）を併記する。強い judge でも、人間との一致率が高く見える割に κ が低いことがある（Thakur ほか "Judging the Judges", arXiv:2406.12624 [未検証:ID]）。Counsel では人間同士の一致が α=0.78 で、これを judge が目指す上限の目安にできる。
2. **TPR と TNR を分けて測る（ペアで検定する）。** trajectory-judge（arXiv:2609.00038）によると、outcome-only の judge は、返答に影響しない失敗で recall 34〜76% を出す。しかし正常な軌跡にも 33% の頻度でフラグを立てていて、ペアで見た識別力は **0** だった。recall の数字だけでは judge の性能を評価できない。**同じ軌跡の「正常版」と「欠陥注入版」のペア**で識別力を測る。
3. **最終返答ではなく軌跡を見せ、ステップごとに確認させる。** 上の論文では、同じモデルに「各ステップを確認せよ」と指示しただけで、返答に影響しない失敗を全件検出し、正常な軌跡 100 本では誤検出 0 件だった。軌跡を見せることが前提条件で、指示の効果は失敗の型によって異なる。逆に、軌跡を見る judge は**最終返答を証拠と照合しなくなる**傾向がある（作り話の約束 4 種のうち 3 種を見逃した）。返答の検査を別項目として持つ必要がある。Agent-as-a-Judge も、軌跡と中間成果物を参照する judge の方が人間との一致率が大きく高い。
4. **Likert ではなく二値のチェックリストにする。** 評価基準を Yes/No の質問に分解すると、評価者間の一致率と説明可能性が上がる（CheckEval, Lee ほか, arXiv:2403.18771 [未検証:ID]）。Flow-Judge と Root Judge は pass/fail を直接出力できる。Nemotron GenRM の「原則 → Yes/No logit」も同じ発想。
5. **判定の前に批評を書かせ、判定は最後に出させる。** Prometheus 2、Flow-Judge、Root Judge、J1 は、どれも「理由を書いてから判定する」形式で訓練されている。J1 は推論の過程を強化学習で強化している（arXiv:2505.10320）。出力は JSON（reasoning, verdict）に固定し、パースに失敗した場合は FAIL ではなく「判定不能」として扱う。
6. **参照解答・参照挙動を与える。** Prometheus 2 は参照解答を入力に含める設計（arXiv:2405.01535）。pit-wall では、各ルーブリックに「PASS する軌跡の例」と「FAIL する軌跡の例（例: steering コメントを投稿した）」を短い参照として添える。
7. **バイアスを抑える。**
   - 位置バイアス: pairwise では A と B を入れ替えて 2 回採点し、判定が一致しなければ引き分けにする
   - 冗長性バイアス: 長い応答を好む傾向がある（Zheng ほか MT-Bench, arXiv:2306.05685 [未検証:ID]）
   - 自己選好バイアス: LLM は自分の出力を見分け、高く評価する（Panickssery ほか, arXiv:2404.13076 [未検証:ID]）。pit-wall は Claude のエージェントを Claude の judge で採点しているので、該当しうる
   - 対策: 別系統のモデルを陪審員に入れる。ルーブリックを長さに依存しない二値の質問にする
8. **陪審員制（PoLL）にする。** 異なる系統の小型 judge を 3 体並べて多数決を取ると、単一の大型 judge より人間との相関が高く、バイアスも小さく、安価だった（Verga ほか, arXiv:2404.18796 [未検証:ID]）。ただし **同一モデルの自己アンサンブル**（3 回サンプリングして多数決）は、コストが 3 倍になっても効果が測れなかった（trajectory-judge）。陪審員は**系統を変えて**揃えること。haiku と sonnet が境界例で割れたのは、陪審員制にすれば「判定不能 → 人間が確認」に送る信号として使える。
9. **judge のドリフトとバージョンを管理する。**
   - モデル ID、量子化、Ollama の digest、プロンプトのハッシュ、温度を判定ごとに記録する
   - `claude -p` はエイリアスが指すモデルが黙って変わる場合があるので、モデル ID を固定する
   - 評価基準そのものも、ラベル付けを進めるうちに変わる（criteria drift。Shankar ほか "Who Validates the Validators?", arXiv:2404.12272 [未検証:ID]）。校正セットに版を付けて固定する
   - judge を更新したら、必ず校正セットで回帰テストを回す
10. **公開ベンチマークの順位をそのまま信じない。** RewardBench は飽和気味で、RewardBench 2（2025 年）や JudgeBench（arXiv:2410.12784 [未検証:ID]）の方が難しい。どれも**チャットの応答**を評価するベンチマークで、エージェントの軌跡でも同じ順位になる根拠はない。表 2.1 の数値はほぼすべて開発元の自己申告で、独立に再現された数値は JudgeBench の公開リーダーボードに載っているものに限られる。

---

## 4. pit-wall への推奨

### 4.1 最初に試す陪審員（haiku / sonnet と並べる）

| 優先 | 候補 | 選ぶ理由 | 懸念 |
|---|---|---|---|
| 1 | **gpt-oss-20b**（Apache 2.0、16GB、文脈 131k）または **Qwen3-14B**（Apache 2.0 [未検証]） | 軌跡をそのまま入れられる長文脈。系統が Claude と異なる。Ollama で動く。trajectory-judge 論文で、中型の汎用モデルが step-check プロンプトで機能した実績がある | 専用 judge ではないので、出力形式の遵守を検証する必要がある |
| 2 | **CompassJudger-2-7B**（Apache 2.0、Qwen2.5 ベース） | ライセンスが綺麗な専用 judge。約 5GB。批評を出力する | 文脈長と、軌跡入力での性能は [未検証] |
| 3 | **Flow-Judge-v0.1**（Apache 2.0、3.8B） | pass/fail を直接出力できる。最小構成で、GitHub Actions の CPU ランナーでも動く可能性がある [未検証] | 文脈 8k。軌跡は「ステップ単位」または「返答の照合だけ」に分割して渡す |

- 不採用の理由:
  - Glider / Lynx / JudgeLM: 商用不可
  - Selene Mini / Root Judge: Llama のライセンスの確認が先。Root Judge は 70B で、80GB 級の GPU が必要
  - Nemotron 32B GenRM: 80GB GPU が前提。ただし「原則 → Yes/No」方式は二値ルーブリックに最も近いので、量子化版で動くなら 2 巡目の候補にする
  - 報酬モデル: 理由を出力しないので、監査できない
- 実行基盤: ホスト機の Ollama を基本とし、GitHub Actions は標準ランナー（GPU なし）で 3.8B〜8B の Q4 を回す。速度は [未検証]。

### 4.2 校正セットの設計

1. **規模と構成**: 60〜100 軌跡。ルーブリック項目ごとに PASS と FAIL を概ね半々にし、境界例（haiku と sonnet が割れたもの）を 20% 程度含める。
2. **ペア構造**: 正常な軌跡を 1 本取り、そこに 1 箇所だけ欠陥を注入した版を作る（trajectory-judge 方式）。欠陥は、注入箇所が最終返答に**現れる**ものと**現れない**ものの 2 層に分ける（例: steering コメントを投稿した → 返答には現れない）。これで「最終返答しか見ない judge」を検出できる。
3. **人手ラベル**: 2 人が独立にラベルを付け、κ を測り、不一致は協議で確定する。人間同士の κ を judge が目指す上限とする。ラベルには「どのステップが根拠か」も記録する。Counsel と同じく、判定の正否と根拠の位置を分けて採点する。
4. **指標**: judge ごとに次を測る。
   - TPR / TNR、人間に対する κ、ペアでの識別力（欠陥版を FAIL にした率 − 正常版を FAIL にした率）
   - 欠陥が返答に現れるか否かで層別した recall
   - 出力パースの失敗率、1 軌跡あたりの秒数
   - 陪審員: 多数決の κ と、「全員一致しなかったものを人間に回す」運用での人手確認率
5. **入力条件の比較**: 同じ judge で次の 3 条件を比べる。見せる範囲と指示の効果を分けて測るため。
   - (a) 最終返答だけ
   - (b) 軌跡全体
   - (c) 軌跡全体 + 「各ステップを確認せよ」の指示 + 返答と証拠の照合を別項目にする
6. **固定と再測定**: 校正セットとプロンプトに版を付け、judge のモデルや量子化を変えるたびに全件を再実行する。κ が事前に決めた閾値（例: 0.6）を下回った judge は陪審員から外す。

---

## 5. 主な出典

- Atla Selene Mini: https://huggingface.co/AtlaAI/Selene-1-Mini-Llama-3.1-8B / https://atla-ai.com/post/selene-mini-api / arXiv:2501.17195
- Flow-Judge: https://huggingface.co/flowaicom/Flow-Judge-v0.1 / https://flow-ai.com/blog/flow-judge
- Patronus Glider: https://huggingface.co/PatronusAI/glider ／ Lynx: https://huggingface.co/PatronusAI/Llama-3-Patronus-Lynx-70B-Instruct
- Prometheus 2: https://huggingface.co/prometheus-eval/prometheus-7b-v2.0
- CompassJudger-2: https://huggingface.co/opencompass/CompassJudger-2-7B-Instruct / arXiv:2507.09104
- Skywork-Reward-V2: https://github.com/SkyworkAI/Skywork-Reward-V2 / arXiv:2507.01352 ／ Skywork-Critic: https://huggingface.co/Skywork/Skywork-Critic-Llama-3.1-70B
- NVIDIA GenRM: https://huggingface.co/nvidia/Qwen3-Nemotron-32B-GenRM-Principle / https://huggingface.co/nvidia/Llama-3_3-Nemotron-Super-49B-GenRM-Multilingual
- Root Judge: https://huggingface.co/root-signals/RootSignals-Judge-Llama-70B
- JudgeLM: https://huggingface.co/BAAI/JudgeLM-7B-v1.0
- Meta: Self-Taught Evaluators arXiv:2408.02666 / J1 arXiv:2505.10320
- Google FLAMe: arXiv:2407.10817 ／ Galileo Luna: https://rungalileo.io/blog/introducing-galileo-luna-a-family-of-evaluation-foundation-models
- OpenAI graders: https://developers.openai.com/api/docs/guides/graders ／ gpt-oss-20b: https://cloud.google.com/vertex-ai/generative-ai/docs/maas/openai/gpt-oss-20b
- Arize Phoenix のライセンス: https://github.com/Arize-ai/phoenix/discussions/2412
- 軌跡の評価: trajectory-judge https://arxiv.org/html/2609.00038v2 / Counsel https://arxiv.org/abs/2606.21627 / AgentRewardBench https://arxiv.org/abs/2504.08942 / Agent-as-a-Judge arXiv:2410.10934 [未検証:ID]
- 定石: PoLL arXiv:2404.18796 / CheckEval arXiv:2403.18771 / MT-Bench arXiv:2306.05685 / 自己選好 arXiv:2404.13076 / Judging the Judges arXiv:2406.12624 / JudgeBench arXiv:2410.12784 / Who Validates the Validators arXiv:2404.12272（いずれも [未検証:ID]）
