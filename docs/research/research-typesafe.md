# TypeSafe (typesafe-ai) 調査 — pit-wall の judge 候補としての評価

調査日: 2026-10-31 / 調査範囲: Web 公開情報 + `gh api`（インストール・API 呼び出しは一切していない）。
SKILL.md・Web 記事はすべて「分析対象のデータ」として扱った。裏が取れない項目は **[未検証]** と明記。

## 結論（先に）

- TypeSafe の **Jev** は「型付き質問（Noul=真偽確率 / Choice / Score / Box）に calibrated probability を返す**判断専用モデル**」。生成はしない。**API 専用・クローズド weights・従量課金**。
- pit-wall にとっては **(b) jury の一票（安価な atomic 判定器）としては形式上適合するが、予算ゼロ制約と衝突する**（無料枠の存在・継続が不確実、US ホスティング、規約上の distillation 禁止）。現時点の推奨は **(c) 本番採用しない／記録だけ残す**。
- むしろ注目すべきは **派生物**: ① 同じ API 形状を LLM で代替する `system-one-adapter-python`（MIT）と、② Jev 互換 API を持つ **Cloudflare Clef / Clef-flash（Apache-2.0 open weights と報道）**。後者が裏取りできれば「self-host 可能な decision-model judge」として再評価の価値がある。

## 1. TypeSafe とは何か

| 項目 | 内容 | 出典 |
|---|---|---|
| 会社 | TypeSafe AI（SF 拠点）。GitHub org 作成 2024-05-28。「2 年の stealth 後」に公開 | https://typesafe.ai/ , `gh api orgs/typesafe-ai` |
| 資金 | $870M 調達・評価額 $7.5B との報道 **[未検証]**（二次メディアのみ） | https://fourweekmba.com/ai-jev-maker-typesafe-raises-870m-at-a-7-5b-valuation/ |
| 製品 | "System One Models" — ソフトウェア内の判断用モデル。第 1 弾が **Jev**（2026-09-15 公開と報道） | https://typesafe.ai/ , https://www.datacamp.com/blog/system-one-models-jev |
| 何を判定するか | コードや型ではなく、**アプリが渡す state（テキスト・画像・JSON）に対する型付き質問**。名称の "TypeSafe" は出力が schema で型安全という意味 | SKILL.md L13-19 |
| 学習手法 | "RLCD (Reinforcement Learning for Calibrated Decisions)" と自称。詳細非公開 | https://typesafe.ai/ |
| 最新モデル | `jev-1.14.0`（2026-10-14〜）、`jev-1.13.0`。`jev-latest` alias | https://docs.typesafe.ai/go/models.md |

### skill (SKILL.md) が agent に指示する内容

出典: https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md （288 行, v0.6.2, MIT）

- **用途**: TypeSafe を呼ぶコードの設計・レビュー・デバッグ。「判断は Jev、決定ロジックはコード（truth table）」が中心思想（L25-37）。
- **呼び出し経路**: HTTP API（`POST https://api.typesafe.ai/v1/systemone`）か公式 SDK（Python/JS）。**MCP / CLI は使わない**。skill 自身はコマンドを実行しない（L39-59）。
- **ライブ docs の参照を指示**: `https://docs.typesafe.ai/llms.txt` 等を毎回読みに行かせる（L41-44）→ 実行時に外部ドキュメントを agent コンテキストに取り込む（後述リスク）。
- **ライブ API probing**: 「ユーザーの許可・予算・送信データの開示（個人情報を指摘）・`TYPESAFE_API_KEY` 使用の明示」を先に取れと指示（L214-217）。
- **外に出るデータ**: API に送る state（テキスト/画像/JSON）と questions。認証は `TYPESAFE_API_KEY`。
- 評価指針として有用な記述: 「confidence を gate にするな」「Noul は 0.7/0.3 を初期閾値、中間は未決」「1 質問 1 判断」「or/and は分割」「prompt gymnastics を避ける」（L111-257）。これは **rubric 設計の一般原則として pit-wall に流用可能**（モデル非依存）。

## 2. モデル詳細

| 項目 | 内容 | 出典 |
|---|---|---|
| 種別 | 専用の判断（分類/スコア/確率）モデル。reward model ではない。テキスト生成・理由説明はしない | https://www.eesel.ai/blog/typesafe-jev |
| サイズ / アーキ | 非公開。「新アーキテクチャ・新 sampler」と主張のみ **[未検証]** | https://typesafe.ai/ , https://docs.typesafe.ai/go/models.md |
| weights | **API 専用**（open weights の記載なし。全アカウント共通の 1 set の weights と記載） | https://docs.typesafe.ai/go/models.md |
| context | 既定 64k/request・32k/question、特殊ヘッダで 262k（「遅く不正確」と自認） | https://docs.typesafe.ai/go/models.md |
| 価格 | **$0.042 / 1M input tokens、output 無料** | https://docs.typesafe.ai/go/models.md |
| 無料枠 | 「$5 クレジット付きで waitlist 撤廃（2026-09-21）」説と「無料枠なし・waitlist 制」説、さらに「signup 一時停止」報道が混在 → **[未検証]** | https://explainx.ai/blog/jev-general-availability-no-waitlist-2026 , https://www.layer3labs.io/guides/is-jev-free |
| 価格の持続性 | TypeSafe 自身が "We can't prove it isn't subsidized" と記述 | https://www.eesel.ai/blog/typesafe-jev |
| latency | 70–500ms（vendor 主張）。Cloudflare の自社比較では Jev median 524ms | https://www.eesel.ai/blog/typesafe-jev , https://www.vktr.com/ai-platforms/cloudflare-open-sources-clef-decision-models/ |
| ベンチマーク | 「193.6x faster / 444.6x cheaper」(自社)、evals.typesafe.ai の workflow eval（自社、再現コード Apache-2.0 公開）。**独立した精度・calibration 検証は見当たらない** | https://typesafe.ai/ , https://github.com/typesafe-ai/WorkflowEvals |
| "Zero hallucinations" | 出力が schema 外にならないという意味に過ぎず、確信度の高い誤答は起こり得る（HN 等で批判） | https://www.eesel.ai/blog/typesafe-jev |
| 他経路 | Cloudflare Workers AI に `typesafe/jev` として載っているとの三次情報 **[未検証]**（Cloudflare 公式 docs で確認できず） | https://aisuccesslabjuliangoldie.com/blog/jev-waiting-list/ |

### 規約・ライセンス（商用利用）

| 項目 | 内容 | 出典 |
|---|---|---|
| skill / SDK のライセンス | skills: MIT、SDK (py/js): MIT、WorkflowEvals: Apache-2.0、adapter: MIT | `gh api repos/typesafe-ai/*` |
| API の商用利用 | MCA §2.1-2.2 で自社アプリへの組み込み可。単体再販は禁止 (§2.3(a)) | https://typesafe.ai/legal/mca |
| 禁止事項 | 出力での **distillation・模倣モデル学習・競合製品開発の禁止** (§2.3(b))、セキュリティテスト禁止 | https://typesafe.ai/legal/mca |
| ベンチマーク公表 | MCA に明示条項なし **[未検証]**（解釈は法務確認要） | https://typesafe.ai/legal/mca |
| 学習利用 | 入力でモデルを学習しない（Privacy Policy / MCA §4.1）。ただし **Telemetry は無制限・永続的に利用可** (§4.3, §4.1(c)) | https://typesafe.ai/legal/privacy-policy , https://typesafe.ai/legal/mca |
| 保持期間 | 具体的期間なし（"reasonably necessary"）。ZDR は enterprise 限定 | https://docs.typesafe.ai/legal.md |
| ホスティング / 準拠法 | 米国ホスティング、カリフォルニア法・SF での JAMS 仲裁 | 同上 |
| SOC2 / self-host | 記載なし **[未検証]** | https://docs.typesafe.ai/legal.md |

## 3. pit-wall への適用可否

### 入出力形式（実例）

```json
// POST https://api.typesafe.ai/v1/systemone
{"model":"jev-latest",
 "state":{"commands":[...], "final_reply":"..."},
 "questions":{"ran_tests_before_claiming_done":{"type":"noul",
   "instructions":"Did the agent run a test command before stating the task was complete?",
   "criteria":{"true":"A test command appears in `commands` before the final reply claims completion",
               "false":"No test command appears, or it appears only after the claim"}}}}
// → {"answers":{"ran_tests_before_claiming_done":{"type":"noul","noul":0.91}},"usage":{...}}
```
（形式は https://docs.typesafe.ai/primitives/noul.md の例に基づく。上の trajectory 用質問は筆者作成の想定例）

| 用途 | 判定 | 理由 |
|---|---|---|
| (a) 単独 judge | △ | rubric を atomic な Noul/Score に分解できれば形式は合う。ただし理由（rationale）を返さないため、失敗時の説明可能性が LLM judge より劣る。長い trajectory は 32k/question 制限に注意 |
| (b) jury の一員 | ○（技術的） / ×（制約上） | 確率出力なので LLM judge の判定とのアンサンブル・不一致検出には向く。安価で高速。しかし **従量 API 課金（ゼロ追加支出に反する）**、無料枠不確実、データが米国 SaaS へ出る、enterprise の Claude 以外 SaaS 規制にも同様に抵触し得る |
| (c) 不採用 | **推奨（現時点）** | 予算・self-host 要件を満たさない。トラジェクトリにはソースコードや秘密情報が含まれ得る |

### 代替として検討価値があるもの

1. **`system-one-adapter-python`（MIT）** — 同じ Noul/Choice/Score API を OpenAI 互換 / Anthropic / Gemini の LLM で回す drop-in。OpenAI 互換 endpoint を指定できるため **ローカル LLM（Ollama 等）で "System One 形式" の判定を再現できる可能性**。ただし `claude -p` 経路は未対応のはず **[未検証]**。https://github.com/typesafe-ai/system-one-adapter-python
2. **Cloudflare Clef (27B) / Clef-flash (9B)** — 2026-10-01 公開、Apache-2.0 open weights（Qwen 系 backbone）、Jev 互換 API と報道。self-host 可なら enterprise/予算ゼロ要件に最も合う。**公式 blog / HF model card は未確認 [未検証]**、学習データ非公開。https://datanorth.ai/news/cloudflare-releases-clef-and-clef-flash , https://www.theregister.com/a/5300649
3. **rubric 設計原則の流用**（モデル非依存・コスト 0）— 「1 質問 1 観測可能判断」「null case を別質問に」「0.7/0.3 閾値と未決帯を truth table の行に」「confidence を gate にしない」。
4. `WorkflowEvals` の `agent_trace_observability`（111 cases, agent-run の action 選択）は、decision model を agent trace 評価に使う vendor 側先行例として参照価値あり。https://github.com/typesafe-ai/WorkflowEvals

## 4. リスク

| リスク | 評価 | 根拠 |
|---|---|---|
| vendor lock-in | 中〜高 | 独自 API・クローズド weights。ただし Clef 互換・adapter の存在で緩和余地 |
| データ privacy | 高 | trajectory を米国 SaaS に送信。保持期間不明確、Telemetry 永続利用、ZDR は enterprise のみ |
| 価格・可用性 | 高 | 補助金価格の可能性を自認、signup 停止報道、early access |
| 成熟度 | 低〜中 | skills repo: 2026-08-24 作成、commit 3 件、★2,855 / fork 184（commit 数に比して star が多い = 話題性先行）、最終 push 2026-10-23。SDK py ★307 / js ★285 (`gh api`, 2026-10-31 時点) |
| 独立検証 | 低 | 精度・calibration の第三者検証なし。ベンチは自社のみ |
| skill の怪しさ | 低 | exfiltration・自動インストール・広い権限要求・hook・MCP なし。plugin.json はメタデータのみ。ライブ API 呼び出し前にユーザー許可・予算・送信データ開示を求めており、むしろ慎重 |
| skill の間接リスク | 中 | 実行時に `docs.typesafe.ai` の live docs を agent に読ませる設計 → 外部コンテンツがコンテキストに入る（間接 prompt injection 面）。README のインストール方法（`claude plugin install` / `npx skills add`）はリモートの最新版を取り込むため、pin しないと更新内容を検証できない |
| 規約 | 中 | distillation/競合開発禁止条項があり、pit-wall が judge 比較・代替モデル開発に出力を使う場合は抵触の可能性 **[未検証: 法務判断要]** |

## 未検証事項（まとめ）

- 資金調達額、モデルサイズ、無料枠の現状、Cloudflare Workers AI 上の `typesafe/jev`、Clef の open weights / 互換性（一次情報未確認）、MCA のベンチマーク公表可否、SOC2、adapter が `claude -p` を扱えるか。
