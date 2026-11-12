# Thoughtworks Technology Radar Vol. 35（2026-11）— pit-crew に関係する項目の抜き出し

作成: 2026-11-11 / 依頼: オーナー「Radar に他に参考になるツールや考え方は無かったか」。PDF 本体は 503 と手元の PDF 読み取り手段の不足で開けず、**Web 版の blip ページ**（https://www.thoughtworks.com/radar/...）を 1 件ずつ開いた [一次]。引用は 125 字制限のため要約。Issue #4（ハーネスはプロダクト / Enterprise harness）と #2（Langfuse）の続き。

## 0. 結論（先に）

1. Radar の 4 つのマクロテーマのうち **「Harness engineering at scale」** が pit-crew の主題そのもの。関連 blip は Techniques に 30 件近くあり、**pit-crew が既にやっていること**（害でなくプロセス準拠を測る、事故からセルを作る、保留セルで一般化を測る、規則を足すより出口と採点に寄せる）を支持する記述と、**まだやっていないこと**（実セッションの観測、規則の削減の定期化、リスク段階別の人の関与）の両方がある
2. すぐ役に立つ候補は 3 つ: **AgentsView**（Claude Code 等の過去セッションをローカルで閲覧・context profiling、Assess）= Langfuse spike の軽い代替または併用 / **Harness quality evaluation**（Assess。非決定的ハーネス = PluginEval、決定的ガードレール = テスト、夜間 or CI で定期実行）= Issue #6 と計画 31 の裏付け / **Risk-tiered human oversight**（Trial）= 設計書 26 の `verdict`（PoC / MVP = final、以降 = detection）と同じ向きで、GQ の「不可逆 4 操作だけオーナー」を一般化する語彙
3. 警告（Caution）3 件は pit-crew の規律に直結: **Agent instruction bloat**（規則は足すだけでは腐る。各モデルごとに「進歩テスト」で削る。Anthropic は Claude Code の system prompt を 80% 削って差が無かった）/ **Human-in-the-loop theater**（判断できない承認を人に押す = 責任の沈み先）/ **Agent skill cognitive surrender**（コミュニティのスキルを読まずに取り込む）
4. Langfuse 自体は Vol.35 の blip には**無い**（2026-04 に Trial、今回は掲載なし）。Stateful guardrails の blip の中で「ガードレールの判定を Langfuse で追跡した」例として出る。Radar の「設計どおりに動いているか」の文脈は **AgentsView / Feedback flywheel / Self-improving harness** 側にある

## 1. マクロテーマ（4）

| テーマ | 要点 | pit-crew との関係 |
|---|---|---|
| Harness engineering at scale | ハーネス（メモリ・文脈・フィードバックループ・ガードレール）は体系的な専門分野になりつつあり、「継続的な所有と保守が要る生きた資産」。企業向けハーネスが製品として現れる | 成果物 2〜4（公開リポジトリとしてのハーネス + 評価）の位置づけそのもの。Issue #4 の ADR 化の根拠 |
| Beyond frontier models | frontier を自動的に選ぶのは「もはや当然ではない」。open-weight / ローカル / 特化モデルを費用・秘匿・依存回避で使い分け、意図的に routing する | fix の「Haiku 級 + 範囲の上限」、E 系列の 8B + Jev（決定専用）の構成と同じ向き |
| Putting more agents to work | 並列セッションと長い課題が増え、**人の注意とレビュー容量がボトルネック**。配信経路が追いつくかを先に確かめる | PO memory「WIP 4」、QM の止めすぎ、fix ロールの新設（人の往復を減らす）に対応 |
| Constructing the AI factory | トークン経済はインフラ経済。Kubernetes でモデルを配備 | 範囲外（Pre-PMF、自前ホスト 1 台） |

## 2. Techniques（pit-crew に効くもの）

| blip | ring | 要点 | pit-crew への写し |
|---|---|---|---|
| Harness quality evaluation | Assess | ハーネス（skills / plugins / AGENTS.md / 決定的ガードレール）は「実際に効く場合だけ」価値がある。非決定的なものは PluginEval、決定的なものはテスト。夜間 or CI で定期実行 | 計画 31 の段 0（台本の対照）= 決定的ガードレールのテスト。Issue #6 の静的リントは PluginEval 相当。**定期実行**はまだ無い |
| Self-improving harness | Trial | エージェントが trace と評価を読んでハーネス（prompt / tools / workflow / memory / middleware）を直す。Meta-Harness・VERSE。**境界つきの実験 + 回帰テスト**、目的と変更範囲は人、一般化の判定は人 | NemoClaw blueprint と同じ型。pit-crew は「変更はエージェント、採否は保留セルと事前登録」で既に境界を置いている |
| Feedback flywheel | Trial（04 月 Assess → 昇格） | spec → plan → implement にハーネス改善の段を足す。retrospective と同型。**足すだけでなく削る**（足すだけだと instruction bloat）。使われていない artifact を定期に点検。モデルが変わったら見直す | GQ の棚卸し（642 件中 267 件が書いただけ）と同じ結論。pit-crew の規定に「削る周期」は未定義 |
| Risk-tiered human oversight | Trial | 全変更を同じ強さで見ると theater になる。最高リスク・不可逆 = 人が適用 / 中 = 人がレビュー / 低 = agent が CI 経由で auto-merge。分類は directory zone + LLM 分類（誤ることがある）。Meta の公開手順 | 設計書 26 `verdict` と GQ「不可逆 4 操作はオーナー」の一般化。**fix の 4 条件（領域）**は zone 分類そのもの |
| Agent pipeline responsibility | Assess | 「build 状態が見えない agent は『赤なら push しない』の合意を守れない」。人を「meat proxy」にしない。pre-push / server-side gate で機械的に止める | fix の B-F5（落ちた検査を再実行）と Z5。GQ の pre-push hook 非採用（ADR-0030）は再考の材料 |
| Agent sandboxing | Adopt | — | Harbor のコンテナ実行が該当 |
| Progressive context disclosure | Adopt | 必要なときだけ指示と能力を出す | Dev / QM の M-skill 型（工程ごとの skill）がこれ。GQ CLAUDE.md の「常時ロードしない」規律 |
| Coding harness for general-purpose agents | Trial | — | 読めていない（Web 版の本文未取得）[未確認] |
| Unattended overnight agentic builds | Trial | — | 同上 [未確認]。pit-crew の夜間実験運用に近い可能性 |
| Toxic flow analysis for AI | Trial | — | 同上 [未確認] |
| Semantic review of AI-edited prose | Assess | — | 同上 [未確認]。E 系列の読み手測度と関係しうる |
| Context profiling | Assess | セッションが何を読み込んでいるかの計測 | AgentsView の機能。instruction bloat の計測器 |

### 警告（Caution）

| blip | 要点 | pit-crew の規律との対応 |
|---|---|---|
| Agent instruction bloat | 規則は個別に正しくても集合として長く・矛盾し・古くなる。中間に埋もれた内容は読まれにくい。手書きの AGENTS.md の方が LLM 生成より効く。Anthropic は system prompt を 80% 超削って差なし。**対策: 決定的 hook に変える / モデルごとに「進歩テスト」で削る / 段階的開示 / 最小の一貫した集合に** | 設計書 30 §0「禁止の文言を増やさない」、QM 設計の「規則を足しても再発率が変わらなかった（I-16）」、memory「規則は足す前に減らす」。**モデル更新時の削減テストは pit-crew に未定義** |
| Human-in-the-loop theater | 判断できない承認を人に押すと「責任の沈み先」になる。代替: risk-tiered で人が本当に判断できる変更だけに絞り、残りは mutation testing / property-based / 形式モデル / agent の意味レビューで**系を操縦する** | 設計書 26 Q3「PoC / MVP で一個一個の approve を人がやる価値は小さい」と同じ。pit-wall の「人のラベルを判定に使わない」 |
| Agent skill cognitive surrender | コミュニティのスキル集や重いフレームワークを読まずに取り込む。依存の盲目的 import と同じ。読んで、自分の文脈の skill に仕立てる | 成果物 4（公開ハーネス）を**出す側**として、読まずに使われる前提で設計する必要（出典つき・薄い核・アダプタ） |
| Naive context compression / AI-accelerated shadow IT | — | 未読 [未確認] |

## 3. Platforms / Tools / Frameworks

| blip | ring | 要点 | 候補 |
|---|---|---|---|
| **AgentsView** https://www.agentsview.io/ | Assess | Claude Code / Codex / OpenCode / Pi の過去セッションを**ローカルで**閲覧・検索・context profiling、prompt-cache と費用の分析、ハーネス利用の改善提案。local-first。チーム同期は未 | **Langfuse spike の軽い代替**（6 サービスのセルフホストなしで実セッションを読む）。pit-wall の B 採点器を当てる入口にはならないが、人が読む用途はこれで足りる可能性 |
| Hunk https://hunk.dev/ | Assess | agent の変更を端末で多ファイルレビュー。agent が自分の変更の横にメモを書く skill | QM / fix の「挙動要約」の置き場所の候補。2026-03 開始で 1.0 前 |
| Agent Client Protocol (ACP) | Assess | — | pit-wall の trajectory の `kind` / `locations` が ACP 流儀（既に採用） |
| Promptfoo | Trial | 評価 | 単発プロンプトの評価器。pit-wall の対象（多段の agent 軌跡）とは粒度が違う。Issue #6 の Stage 1 候補 |
| Deep Agents（LangChain） | Trial | NemoClaw が載せるハーネスの 1 つ | NemoClaw 調査（`research-nemoclaw-adoption.md`）側で扱う |
| DeepSeek Harness (DSH) / Entire CLI / Herdr / Omnigent / Claude Managed Agents | Assess | — | 未読 [未確認] |
| OpenCode | Adopt | 企業が独自 coding agent を OpenCode 上に作る例 | 成果物 4 の配布先（Claude Code 以外）の候補 |

## 4. pit-crew への含意（[推論]）

- **支持されていること**: プロセス準拠を主に測る（結果の害でなく）/ 事故 → セル / 保留セルで一般化 / 規則より出口と採点 / 不可逆だけ人 / 段階的開示 / サンドボックス実行
- **足りないこと**: (1) **実セッションの観測**（Langfuse spike または AgentsView）(2) **規則の削減の周期**（モデル更新ごとの「進歩テスト」: 既定スキルの規定を 1 つ外して B が落ちないものは削る）(3) **評価の定期実行**（夜間 / CI。成果物 4 の「CI で再現」と同じ）(4) **risk-tiered の語彙**を設計書 26 / 30 のアダプタに置く（zone + 分類）
- **取り込み候補の順**: AgentsView を 1 時間で試す（Langfuse spike の前に、実セッションが読める最短路か確かめる）→ Langfuse spike（B 採点器を当てる経路が要るなら）→ 規則削減の周期を設計書 11 / 26 / 30 の共通規定に

## 5. PDF 本文から追加で読んだもの（markitdown で Markdown 化、`E:\Users\kokor\Downloads\tr_technology_radar_vol_35_en.md`）

| blip | ring | 要点 | pit-crew への写し |
|---|---|---|---|
| Semantic review of AI-edited prose | Assess | agent が仕様・ADR・計画を人より速く書き換える。文字 diff では意図の変化が埋もれる。**LLM が意味の変化（事実の改変・矛盾・受入基準の再定義・範囲の変化）を分析**する層を足す。文書を編集するたびに走る skill として実装 | QM の V2「文脈を読む」/ 設計書同期の確認、fix の Z4（方針ファイルに触れない）の検出器候補。E 系列の的を絞った抽出（主張 = 最終状態）と同じ道具で作れる |
| AI-driven documentation sprawl | Caution | agent と spec-driven ツールが大量の Markdown を生む。文書は CI を通らず、古く矛盾した spec が溜まり「big ball of documentation mud」に。古い ADR / 矛盾 spec が文脈を食い agent を誤らせる | GQ docs/CLAUDE.md の「経緯メタ情報の混入禁止」「削除主義」、maintenance の MT-5（矛盾の除去）。pit-crew の docs/planning も 31 本あり、同じ対象 |
| Production-aware coding agents | Assess | 本番の観測データ・道具を agent に渡す。agent pipeline responsibility を本番まで延ばす「多層のフィードバック」 | QM の S5 事後（deploy 後の health）、監査の実機確認 skill に対応 |
| Programmatic tool calling | Assess | 1 回ずつでなくコードで道具を束ねて実行、結果だけを文脈へ。承認の粒度が粗くなる危険 | E 系列の Jev / 8B の batching と同じ発想。評価対象の agent がこれを使うと trajectory の tool_calls の粒度が変わる（grader への影響を将来確認） |
| Coding throughput as a measure of productivity | Caution | AI 生成率・トークン量は活動量で、生産性の代理にならない（Goodhart）。DORA と事業成果へ | pit-crew が「害でなくプロセス準拠」を主にし、活動量を量にしない設計と整合 |
| Meat proxy | Caution | 読まず・検証せず・判断を足さずに LLM 出力を転送する人。theater の「偽の著者性」版 | PO memory「指摘は採否を決めてから動く」、QM の「報告は実物と突き合わせる」 |
| Toxic flow analysis for AI | Trial | 私的データ × 信頼できない内容 × 外部通信の「致死的三点」。agent skill に隠れた exfil 指示も対象。Agent Scan | 成果物 4（公開ハーネス）に skill を**配る側**として、skill の静的検査（Issue #6）に exfil 検出を含める根拠 |
| Naive context compression | Caution | 圧縮ツールはキャッシュを壊し費用が増えることがある。先に context profiling | 評価の判定には関係しないが、Dev / QM スキルの長さ（instruction bloat）の計測に context profiling を使う根拠 |
| Agent Package Manager | Trial | agent 設定の依存管理（manifest / lock に content hash と provenance / SBOM / 隠し Unicode の走査 / policy）。「agent 文脈を供給網として扱う」 | **成果物 4 の配布形**の候補。versioned skills の配布、pre-1.0 |
| Agent Plugins | Assess | skills + MCP を束ねる cross-vendor の最小標準（Amazon / Microsoft / OpenAI）。既存の skills repo を plugin 兼用にしやすい | 成果物 4 の包装形。Claude Code 以外（Codex / OpenCode）への配布 |
| DeepSeek Harness (DSH) | Assess | 「全部 plugin」の runtime。**append-only の session log**（prompt・文脈注入・tool call・subagent）で検査・再開・分岐・再生ができる = 「再構成した系が実際に何をしたかの記録」 | Radar が言う「設計どおりに動いたか」の記録は**この種の session log**。Claude Code の transcript JSONL が pit-crew での相当物（→ 今回の spike） |
| Entire CLI | Assess | Git に hook して agent セッション（prompt・transcript・tool call・触ったファイル）を commit と並べて repo に保存（branch 履歴の外）。チームで共有。**プライバシーで反発するチームもあり、その場合は AgentsView**（ローカル） | 「軌跡を git に持つ」= pit-crew の runs/ と同じ原則。実セッションの共有基盤の候補だが、会社の題材では個人の prompt の共有に注意 |
| Git AI | Trial | AI 生成行を agent / model / prompt に紐づける git notes の open standard。checkpoint 単位で人 / AI の著者性 | fix / Dev の commit に「どの指摘・どの工程で書いたか」を残す形の候補（B-F8 の自然な拡張） |
| Grilling | Trial | 実行前に agent が人に質問して曖昧さを潰す（mattpocock/skills） | Dev の I0 受け付け「背景・目的が不明なとき」と同じ。pit-crew の AskUserQuestion 運用 |
| Hindsight / Promptfoo / Deep Agents / Herdr | — | 記憶基盤 / 評価と red team（hosted 部分はデータが出る）/ LangChain のハーネス / 並列セッションの多重化 | 直接の採用候補ではない。Deep Agents は NemoClaw 調査側 |

Tests as data over tests as code（Assess）は本文の抜き出しに失敗（目次と重なる）。読む必要があれば Markdown 行を直接開く。
