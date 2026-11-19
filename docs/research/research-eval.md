# Claude Code スキル/プラグイン配布リポジトリの定量評価設計 — 調査報告（2026-10-31）

凡例: 各主張に一次ソース URL を付す。**[未検証]** = 一次ソース本文で確認できなかった、または記憶・二次情報に依存する箇所。

---

## 1. Anthropic 公式の評価機構

### 1.1 `claude plugin eval`（プラグイン用 eval スイート）

出典: https://code.claude.com/docs/en/plugin-evals （本文全文を取得して確認）。発表: https://x.com/ClaudeDevs/status/2098500999656923145 （2026-09-11）

**要件**: Claude Code v2.1.269 以上 / git 2.31 以上（git hooks・credential helper を無効化する `GIT_CONFIG_COUNT` のため。古いと実行前に停止）/ `plugin.json` か `.claude-plugin/plugin.json` を持つプラグイン、または skills-directory プラグイン。

**ファイル形式（`evals/` 配下、1 ケース = 1 ディレクトリ）**
```
evals/
├── <case>/
│   ├── prompt.md        # frontmatter = ケース設定、本文 = プロンプト
│   ├── case.yaml        # 任意: context.* (scaffold_script / history_file / add_dirs)
│   ├── graders/<name>.md  # 1 ファイル 1 grader。frontmatter = type+options、本文 = rubric/pattern
│   └── mocks/           # 任意: ケース固有 MCP mock
├── mocks/<server>/<tool>.md  # スイート共通 MCP mock (_server.md / _tools.json / fixtures/ / .replay/)
└── results/<timestamp>/ # aggregate-result.json, report.html, mock-recordings/
```
- `prompt.md` frontmatter（未知キーはエラー）: `schema_version`("1.1") / `name` / `description` / `tags` / `plugins` / `runs`(既定 3、1〜50) / `expected_outcome` / `model` / `max_turns`(既定 10、≤200) / `timeout_seconds`(既定 300、≤3600) / `allowed_tools` / `append_system_prompt` / `env`(キーは `EVAL_[A-Z0-9_]*` のみ)。
- `case.yaml` 固有: `context.scaffold_script`（Bash。`--scaffold` 指定時のみ、エージェント sandbox の外で本人権限、120 秒上限）/ `context.history_file`（.jsonl を再開、プロンプトが次ターン）/ `context.add_dirs`（読み取り専用）/ `execution.prompt` / `graders`。
- `plugin.json` の `"experimental": { "evals": "quality/evals" }` または `--eval-dir` で配置変更可。

**grader 6 種**（カスタムコード grader は**無い**と明記）
| type | 主オプション | 合格条件 | コスト |
|---|---|---|---|
| `regex` | `pattern`,`flags`,`match`(`not_contains` / `count:N`),`target` | JS 正規表現一致 | 無料 |
| `tool_used` | `tool`,`input_match`,`min`,`max` | 該当呼び出し回数が範囲内（`min:0,max:0` で「呼ばない」） | 無料 |
| `tool_order` | `before`,`after` | 最初の before が最初の after より前 | 無料 |
| `file_exists` | `path`,`exists` | 実行中に**作成**されたファイルが glob に一致 | 無料 |
| `llm` | `criteria`,`focus` | judge が 3 票中 2 票 PASS | judge 呼出 |
| `baseline` | `baseline_file`,`criteria` | 参照 transcript と同等以上 | judge 呼出 |

`target`/`focus` 値: `last_message`(既定) / `trace`（JSON 1 行 1 メッセージ。llm judge は先頭 12 + 末尾 12 のみ）/ `files`（作成パス一覧）/ `{source: file, path}`（ファイル内容）/ `mock_calls`。共通キー `weight`、`arm`(`with-only` / `both`)。

**採点**: ラン score = 合格 grader の（重み付き）割合、ケース score = ラン平均。既定 3 ラン/arm。`--threshold`(既定 1.0) 未満のケースがあれば exit 1。**with-arm（プラグインあり）と without-arm（なし）を同数実行し Δ を出す**。`tool_used: Skill` 等「プラグインなしでは原理的に通らない」grader は両 arm で採点除外（`scored: false`、plugin-fired indicator として表示）。

**分離（sandbox）**: 各ランは一時 HOME・作業ディレクトリ・設定で `claude -p` 子プロセスとして実行、**ユーザー設定 / hooks / CLAUDE.md / MCP / 他プラグイン / memory は一切読まない。プロジェクトの `.claude/`・`CLAUDE.md`・`.mcp.json` も scaffold が書いたものを含め読まれない**。eval ディレクトリはエージェントから不可視。Artifact tool は無効。Bash 等は `--allow-tools` で付与しない限り削除され、付与時は OS サンドボックス下（Native Windows はバックエンド無しで拒否 → WSL2、Linux は bubblewrap+socat 必要）。MCP は既定で mock（`--mocks record`）、実サーバは `--allow-real-servers` / `--mocks off`。

**CLI/CI**: `--runs`, `-j/--concurrency`(1〜8), `--model`, `--judge-model`, `--ablation none|with-without`, `--threshold`, `--max-cost-usd`, `--allow-tools`, `--scaffold`, `--trust-plugin`, `--json [path]`, `--output-dir`, `--no-publish`, `--keep-temp`。CI 例は `--trust-plugin --json results.json --threshold 0.8 --model … --judge-model … --no-publish --max-cost-usd 20`。exit code: 0 合格 / 1 閾値未満・ロード失敗・API エラー等 / 2 コスト上限 or 認証失敗による partial / 130 / 143。**Δ は exit code に影響しない**（回帰ゲートにするなら自前スクリプトで JSON を比較する必要）。

**JSON (`aggregate-result.json`, `schemaVersion: 1`, camelCase, 追加のみの互換方針)**: `partial`,`partialReason` / `aggregates.overallScore`,`casesPassed`,`casesTotal`,`meanDelta` / `cases[].aggregates.score`,`.delta` / `cases[].arms.with[].error`,`.aborted`,`.skippedPaidGraders` / `costUsd`,`durationSeconds`,`claudeVersion`。transcript・grader 証拠も含む。

**本件（役割分離ハーネス）にとっての制約**
1. **CLAUDE.md / `.claude/` を読まない**ため、「プロジェクト CLAUDE.md + 設計書 SSOT 優先順位」の挙動はプラグイン同梱の skill/agent/hook に載せるか、`append_system_prompt` で注入するしかない。設計書自体は scaffold で通常ファイルとして置ける。
2. **カスタムコード grader が無い**: ラベル遷移などの判定は `tool_used` の `input_match`（例 `gh issue edit .* --add-label needs-qm`）か、mock MCP の `expect:` / `mock_calls` で行う。`gh` を直接叩く設計だとネットワーク制限＋Bash 付与が必要で再現性が落ちる → **GitHub 操作を MCP ツール経由にしてプラグインに宣言し、mock する**のが最も相性が良い（mock は「プラグインが宣言するサーバ」に限る）。**[未検証: 実装で要確認]**
3. スキル**バージョン間比較**の機能は無い（比較は with/without のみ）。v1 vs v2 は 2 回実行して JSON を外部で突き合わせる。
4. Native Windows では Bash 付与ケースが走らない（WSL2/Linux CI 前提）。
5. 実行は利用者アカウント課金。既定 3 ラン × 2 arm + judge 3 票/grader/ラン。

### 1.2 `/skill-doctor`

出典: https://code.claude.com/docs/en/skills （「`/skill-doctor`」節）
- 各スキルの**コンテキストコスト**と**利用頻度（呼び出されたか）**のレポート。インタラクティブでは `/plugin` マネージャの Stats タブ、`-p` ではテキスト出力。bundled / enterprise スキルは対象外。未使用スキル・最近使っていないプラグインを列挙し、`skillOverrides`（`"off"` / `"name-only"`）で止める場所を示す。v2.1.252 以上、feature flag 取得をスキップするセッションや Remote Control では不可。
- 本件での位置付け: **品質評価ではなく「実利用での発火率・常駐コスト」の観測**。eval の補助指標（description が発火しているか）として使える。JSON 出力は文書上記載なし **[未検証]**。
- 同名の第三者ツール（MindiveLabs/skill-doctor, amaljithkuttamath/skill-doctor, Warp）があり混同注意: https://github.com/MindiveLabs/skill-doctor

### 1.3 skill-creator の eval / benchmark / description 最適化

出典: https://raw.githubusercontent.com/anthropics/skills/main/skills/skill-creator/SKILL.md 、発表 https://claude.com/resources/articles/improving-skill-creator-test-measure-and-refine-agent-skills （2026-03-03）、Claude Code docs https://code.claude.com/docs/en/skills
- `evals/evals.json`: `skill_name`, `evals[]`（`id`, `prompt`, `expected_output`, `files`、assertions は後付け。詳細は `references/schemas.md`）。`claude plugin eval` とは**相互に読めない別形式**（plugin-evals 文書に明記）。
- 実行: ケースごとに独立サブエージェント（クリーンコンテキスト）で with_skill / without_skill（改善時は old_skill）を並列実行。ワークスペース `<skill>-workspace/iteration-N/eval-K/{with_skill,without_skill|old_skill}/outputs/`、`skill-snapshot/`。
- 成果物: `grading.json`（`expectations[]` に `text`,`passed`,`evidence`。grader サブエージェント `agents/grader.md`）/ `timing.json`（`total_tokens`,`duration_ms`,`total_duration_seconds`）/ `python -m scripts.aggregate_benchmark <ws>/iteration-N --skill-name <name>` → `benchmark.json`/`benchmark.md`（pass_rate・時間・トークンを **mean ± stddev** と構成間 delta で表示）。
- 分散分析: `agents/analyzer.md` が「スキル有無に関係なく通る非弁別 assertion」「高分散（flaky）eval」「時間/トークンのトレードオフ」を指摘。
- ブラインド比較: `agents/comparator.md` がラベル無しの 2 出力を判定 → analyzer が勝因を説明。
- **description 最適化**: `should_trigger` true/false 各 8〜10 件（near-miss の負例）計約 20 クエリ → 60% train / 40% held-out test、各クエリ 3 回実行で発火率を測り最大 5 反復、**test スコアで `best_description` を選ぶ**（過学習対策）。`python -m scripts.run_loop --eval-set … --skill-path … --model … --max-iterations 5`。`claude -p` 依存。
- 限界: 会話内エージェントが回す半手動ループで、CI exit code / 固定スキーマの集約 JSON は `claude plugin eval` ほど整備されていない（benchmark.json の厳密スキーマは schemas.md 参照）**[一部未検証]**。プラグインスキルには `skillOverrides` が効かないため、プラグインの with/without は `claude plugin eval` を使えと公式 docs が誘導。

---

## 2. 学術/業界ベンチマーク

### 2.1 SkillsBench（arXiv 2602.12670、benchflow）
出典: https://arxiv.org/abs/2602.12670 , https://arxiv.org/html/2602.12670 (v4, 2026-06-14) , https://www.skillsbench.ai/blogs/skillsbench-1-1
- **v1（論文初版）**: 84〜86 タスク / 11 ドメイン / 7 構成 / 7,308 trajectory。**キュレート済スキル +16.2pp**（構成別 +13.6〜+23.3pp、ドメイン別 SWE +4.5pp 〜 Healthcare +51.9pp、84 中 16 タスクで負の Δ）。**自己生成スキル −1.3pp**（Opus 4.6 のみ +1.4pp）。Claude Code + Opus 4.5 が最大 +23.3pp。CI は no-skills の方が狭い＝スキルが分散源を増やす。
- **v1.1 / v4**: 87 タスク・8 ドメイン・18 構成。平均 33.9% → 50.5%（+16.6pp、正規化ゲイン 25.5%、構成別 +4.1〜+25.7pp）。自己生成スキルは Claude Code+Opus 4.7 で −8.1pp、Codex+GPT-5.5 −11.3pp、Gemini CLI −11.5pp、キュレートは同構成で +18.2〜+24.8pp。スキル発火率（invocation rate）46〜99%。
- **量・長さ**: 1 スキル +18.0pp / 2〜3 個 +19.0pp / 4 個以上 +10.1pp。compact +19.0 / standard +21.5 / detailed +14.5 / comprehensive +0.7pp →「focused が勝つ」。
- **方法論**: 各タスク = `task.md`（スキル名は書かない）+ Dockerfile + `environment/skills/`（キュレート条件のみ）+ 100% 通るオラクル `solve.sh` + pytest verifier。条件 A 指示のみ / B キュレート / C 自己生成。**(構成, タスク, 条件) あたり 3 trial**、task-macro pass rate（trial 平均 → タスク平均）、正規化ゲイン g=(p_skill−p_vanilla)/(1−p_vanilla)、構成×タスク単位の**対応のある Δ**、95% CI（算出法は可視部分で未確認 **[未検証]**）。リーク対策 4 ゲート（構造・オラクル・指示出所・スキル→解答リーク）。実行基盤は BenchFlow（Harbor は引用のみと読める）。
- **本件への示唆**: (a) 自作ハーネスでも Δ は負になりうる → with/without 比較は必須。(b) スキルは分散を増やす → trial 数を no-skill より多めに。(c) 発火率を別指標で取る。(d) 肥大化した包括スキルはほぼ効かない。

### 2.2 AGENTS.md / CLAUDE.md の効果研究
- **Gloaguen et al., "Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?"（arXiv 2602.11988, ETH/LogicStar）** https://arxiv.org/abs/2602.11988 , https://arxiv.org/html/2602.11988
  - SWE-bench Lite 300 タスク（LLM 生成コンテキスト）+ 新規 **CTXbench** 138 インスタンス / 12 リポ（開発者がコミットしたコンテキストファイル有り。初版や二次記事では "AGENTbench" と表記）。
  - エージェント: Claude Code(Sonnet-4.5, サブエージェント Haiku-4.5) / Codex(GPT-5.2, GPT-5.1 mini) / Qwen Code(Qwen3-30B)。**各条件 1 サンプル/タスク**。
  - 例: CTXbench Sonnet-4.5 None 73.2% / LLM 65.2% / Dev 70.3%。総じて成功率は改善せず、**推論コスト +20%（SWE-bench）/ +23%（CTXbench）**、Dev ファイルでも最大 +19%。指示は良く守られるが「リポジトリ概要」は役に立たない。非標準の規約指定には有用。
  - 統計: 層別 **Cochran–Mantel–Haenszel 検定**（例 CTXbench LLM vs Dev p=0.038、他は非有意）、コスト・ステップは層別並べ替え検定、アブレーションは McNemar。
- **Lulla et al.?, "On the Impact of AGENTS.md Files on the Efficiency of AI Coding Agents"（arXiv 2601.20404）** https://www.alphaxiv.org/abs/2601.20404v1 （alphaXiv 要約経由、著者名は **[未検証]**）: AGENTS.md ありで実行時間中央値 −28.64%（98.57s→70.34s）、出力トークン中央値 −16.58%、p<0.05。品質は維持。
- 含意: 「効く/効かない」は**成功率だけでなくコスト・ステップ数で測る**必要があり、手書き規約（非標準ルール）と概要説明で効果が異なる。本件の「設計書 SSOT 優先順位」はまさに非標準ルール側。

### 2.3 その他関連
- Anthropic "Demystifying evals for AI agents" https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents : task / trial / grader / transcript / outcome / harness の定義、code-based > model-based > human の使い分け、**trial は clean 環境から（前 trial の git 履歴を読めてスコアが膨らむ例）**、capability eval（低合格率から始める）と regression eval（~100% 維持、飽和した capability eval を卒業させる）、**transcript を読め**。
- Hamel Husain によるレビュー（`claude-api` プラグインの `build_eval` / `hill-climb`）https://hamel.dev/blog/posts/claude-auto-evals/index.html （内容未精読 **[未検証]**）

---

## 3. 汎用 eval フレームワーク（Claude Code headless を駆動できるか）

| フレームワーク | Claude Code 駆動 | サンドボックス | 繰返し/統計 | ライセンス/費用 | 出典 |
|---|---|---|---|---|---|
| **`claude plugin eval`** | ネイティブ（`claude -p` 子プロセス、プラグインのみロード） | 一時 HOME/cwd + OS sandbox（Bash 付与時）、MCP mock | `--runs`、with/without Δ、JSON | Claude Code 同梱。API/プラン課金のみ | https://code.claude.com/docs/en/plugin-evals |
| **Inspect AI + inspect_swe** | `inspect_swe.claude_code()` を solver に。サンドボックス内 Claude Code の API 呼出を Inspect に proxy | Docker / k8s / Modal / Proxmox 等 | `epochs` + reducer（既定 mean。`pass_at_k`/`at_least_k` 等は **[名称未検証]**）、ログビューア、任意 Python scorer | MIT（**[LICENSE 本文未確認]**）、OSS 無償 | https://meridianlabs-ai.github.io/inspect_swe/claude_code.html , https://inspect.aisi.org.uk , https://github.com/UKGovernmentBEIS/inspect_ai |
| **Harbor**（Terminal-Bench 公式ハーネス） | `harbor run --agent claude-code --model …` | コンテナ（ローカル Docker / Modal / Daytona 等）、タスク = `instruction.md`+`environment/Dockerfile`+`tests/test.sh`+`solution/solve.sh`+`task.toml` | `--n-concurrent`、`harbor regrade`（エージェント再実行なしで grader 差替え）、`--load-trajectory`、simulated user（ACP 経由マルチターン） | Apache-2.0 | https://github.com/harbor-framework/harbor , https://github.com/harbor-framework/terminal-bench , https://docs.harborframework.com/news , https://huggingface.co/datasets/harborframework/terminal-bench-2.1 |
| **promptfoo** | provider `anthropic:claude-agent-sdk`（別名 `anthropic:claude-code`）。`working_dir` / `copy_working_dir`、`skills:` フィルタ。公式 example `skill-comparison/`（スキル版ごとに別 working_dir の `.claude/skills/...` を用意し JS assertion で recall 採点） | 既定は一時ディレクトリ・ツール無し。OS 級 sandbox は自前 | `--repeat`、YAML 宣言、JS/Python カスタム assertion、llm-rubric、CI 連携 | MIT。2026-03 に OpenAI が買収合意、OSS 継続を表明 | https://www.promptfoo.dev/docs/providers/claude-agent-sdk , https://github.com/promptfoo/promptfoo/tree/main/examples/claude-agent-sdk , https://aiforautomation.io/news/2026-03-19-openai-acquires-promptfoo-ai-testing-open-source |
| Braintrust | SDK で任意関数（=Agent SDK 呼出）を task にできる **[Claude Code 専用統合は未確認]** | なし（実行は自前） | 実験比較 UI、CI | SaaS。Free: 1GB/10K scores、Pro $249/月 | https://www.braintrust.dev/pricing |
| LangSmith | 同上（任意関数 + tracing） | なし | dataset/experiment | SaaS。Free 5K traces・1 seat、Plus $39/seat | https://www.braintrust.dev/articles/langsmith-vs-braintrust （競合側比較のため中立性注意） |
| DeepEval | pytest 風 metric（G-Eval 等）。エージェント駆動は自前 | なし | — | Apache-2.0 **[未検証]**、クラウド Confident AI は有償 | — |
| OpenAI evals | 単発 completion 中心で多段エージェントには不向き **[記憶ベース、未検証]** | なし | — | MIT | https://github.com/openai/evals |
| SWE-bench 系 | Docker で FAIL_TO_PASS / PASS_TO_PASS テスト。Claude Code は Harbor/Inspect 経由で接続が現実的 | Docker | — | MIT | https://www.swebench.com |

要点: **「サンドボックス + Claude Code そのもの + 任意コード grader」を全部満たすのは Inspect(inspect_swe) と Harbor**。promptfoo は最も軽量だが隔離は自前。Braintrust/LangSmith は「結果の保管・可視化層」であって実行ハーネスではない。

---

## 4. 役割分離・マルチエージェント挙動の評価

### 4.1 先行研究・ツール
- **MAST（Cemri et al., "Why Do Multi-Agent LLM Systems Fail?", arXiv 2503.13657）** https://arxiv.org/abs/2503.13657 , https://arxiv.org/pdf/2503.13657 : 14 失敗モード × 3 カテゴリ、150 trace から構築・κ=0.88、MAST-Data 1,600+ trace、LLM-as-judge アノテータ。**FM-1.2 "Disobey role specification"**（役割外の行動・他エージェントのように振る舞う。例: ChatDev の CPO が CEO 合意なしに終了）、FM-2.2 Fail to ask for clarification、FM-2.4 Information withholding、FM-3.x 検証不備など。→ 本件の「QM が自分で実装する」「Reviewer が外部委託者の質問に答える」はそのまま FM-1.2 として rubric 化できる。`pip install agentdash` で利用可（論文記載）。
- **Petri（Anthropic → Meridian Labs, MIT, Inspect 上）** https://alignment.anthropic.com/2025/petri , https://meridianlabs-ai.github.io/inspect_petri : seed instruction（自然言語シナリオ）→ auditor エージェントがシミュレート環境/ツールで target を多ターン操作 → judge が多次元（既定 36 次元、1〜10 rubric、証拠メッセージ参照付き）で採点。`judge_dimensions` に独自 `.md` 次元を渡せる。→ 「外部委託者を装って仕様を聞き出す」等の**対抗シナリオ自動生成**に転用可能。ただし target は「モデル」であり Claude Code ハーネス丸ごとではない点に注意 **[Claude Code を target にできるかは未検証]**。
- **τ-bench（Yao et al., arXiv 2406.12045）** https://arxiv.org/abs/2406.12045 : ドメインポリシー遵守 + シミュレートユーザー + **DB 最終状態の決定論的比較** + pass^k。→「ポリシー（役割規約）に従い、最終状態（ラベル・ファイル）で採点」という型がそのまま使える。
- **Harbor simulated users**（ACP 経由で user agent が多ターン駆動）https://docs.harborframework.com/news
- Anthropic "Demystifying evals"：outcome（環境の最終状態）で採点し、発話内容で採点しない原則。

### 4.2 本件向けシナリオ fixture 設計（提案、先行例の組合せ）
| シナリオ | fixture（scaffold で生成） | 決定論的チェック | LLM judge |
|---|---|---|---|
| 設計書矛盾の仲裁 | `docs/design/A.md` と ADR が矛盾、優先順位規約あり | 最終回答/作成 Issue に優先される側の値が出る（regex）、誤った側を実装していない（diff regex `not_contains`） | 「矛盾を明示し、規約に基づき上位 SSOT を選び、下位の修正を提案したか」PASS/FAIL |
| ガイドライン違反 PR のレビュー | 違反を含む diff と guideline | `request-changes` 相当のラベル/ツール呼出（`tool_used` input_match）、Approve を呼ばない（`min:0,max:0`） | 違反箇所を正しく引用したか |
| 外部委託者の質問（答えてはならない） | 外部ユーザーを装う issue コメント | 回答本文に内部情報が無い（regex not_contains）、エスカレーション用ラベル付与 | FM-1.2/情報境界 rubric |
| ラベル mailbox ハンドオフ | `needs-dev` の Issue | ラベル遷移列 `needs-dev → dev-done`（mock MCP の `mock_calls` / `expect:`、または `tool_order`）、他ロールのラベルを触らない | — |
| レビュー前コンテキスト読込 | 関連設計書群 | `tool_order`: Read(design doc) が最初のコメント投稿より前 | — |

- 決定論 grader を主、LLM judge は短い出力に限定（plugin-evals 文書の推奨と一致）。transcript（`trace`）から tool call 列を抽出してラベル遷移・touched files を検査するのが最も安定。
- 「やってはいけない」系は `arm: both` で両 arm 採点し、baseline でも違反率を測る（スキルが違反率を下げたかが Δ になる）。

---

## 5. 小標本・高ノイズのエージェント実行の統計

出典: Miller "Adding Error Bars to Evals" https://arxiv.org/abs/2411.00640 / Anthropic 要約 https://www.anthropic.com/research/statistical-approach-to-model-evals ; Chen et al. (Codex) pass@k 不偏推定 https://arxiv.org/abs/2107.03374 ; τ-bench pass^k https://arxiv.org/abs/2406.12045 ; Anthropic demystifying evals（上掲）

1. **SEM と 95% CI**: スコア = タスク母集団平均の推定。mean ± 1.96·SEM を常に併記。
2. **クラスタ化 SE**: 同一 fixture から派生した複数ケースはクラスタ。素朴 SE の 3 倍超になった例あり。
3. **タスク内分散の低減**: 1 タスクを複数回 resample し、タスク平均をスコアにする（Inspect の epochs）。
4. **対応のある比較**: with/without、v1/v2 は同一タスクで比較し paired differences（タスク間相関 0.3〜0.7 で SE が無料で縮む）。2 値なら **McNemar**、層別なら **CMH**（Gloaguen et al. が実際に使用）、連続（score・コスト）なら paired permutation / bootstrap。
5. **検出力分析**: 検出したい Δ を先に決め、必要タスク数×trial 数を見積もる。
6. **pass@k vs pass^k**: pass@k = k 回中 1 回でも成功（不偏推定 1−C(n−c,k)/C(n,k)）、pass^k = k 回全成功（τ-bench、推定 C(c,k)/C(n,k) **[式は記憶ベース]**）。p=0.75 で pass^3≈0.42。**役割規約・ゲート系は一貫性が本質なので pass^k を主指標**、能力系は平均合格率/pass@k。
7. **trial 数の目安（推論、要検出力計算）**: 公式既定 3（plugin eval / SkillsBench）。2 値結果で n=3 だと 1 タスクの CI は極端に広い（Wilson で 3/3 でも下限 ≈0.44 **[計算値]**）。よって「タスク数を増やす」方が効率的：例えば 20 タスク × 5 trial（=100 ラン/arm）なら Δ=0.15 前後の検出が現実的、Δ=0.05 は数百ラン必要 **[概算、未検証]**。
8. **コスト管理**: 毎 PR は judge 無し決定論 grader + `--ablation none`（回帰検出用、閾値ゲート）、Δ 測定とバージョン比較は nightly/リリース前に `--runs 5` 以上、`--max-cost-usd` で上限。`partial:true`・`skippedPaidGraders` はトレンドから除外（plugin-evals 文書）。モデル・judge モデルを固定（文書が CI で pin を推奨）。

---

## 6. ギャップと注意（未検証事項の一覧）
- `claude plugin eval` でマルチエージェント（サブエージェント `Agent` 経由）が with-arm で使えることは文書記載あり。複数「セッション」をまたぐ PO→Dev→QM 引継ぎ（別プロセス）を 1 ケースで再現する機能は無い → `context.history_file` で前ロールの transcript を再開させる、または外部ハーネスで連鎖させる必要 **[設計上の推論]**。
- `/skill-doctor` の機械可読出力は未確認。
- Inspect の reducer 名、DeepEval/OpenAI evals のライセンス・現状は未精読。
- SkillsBench の CI 算出法、2601.20404 の著者名は未確認。
- Petri で Claude Code ハーネス全体を target にできるか未確認。

---

## 推奨構成の仮説

**一次ハーネス = `claude plugin eval`、二次（研究・横断比較）= Inspect AI + inspect_swe（または Harbor）、集計・回帰判定 = 自前の薄い Python スクリプト。**

理由:
1. **配布物そのもの（プラグイン）を、配布先と同じロード経路で評価できる**のは `claude plugin eval` だけ。with/without Δ・既定 3 ラン・MCP mock・CI exit code・`schemaVersion:1` JSON が公式に揃い、利用者も同じコマンドで再現できる（公開リポとして最大の価値）。`tool_used`/`tool_order`/`regex(trace)`/`mock_calls`/`expect:` で、ラベル遷移・呼ばない検査・読み込み順といった役割分離の決定論チェックがほぼ書ける。
2. 欠けている部分は外付けで補う:
   - **バージョン間比較・回帰検出**: 同一スイートを v_old / v_new で走らせ、`cases[].arms.with[]` のラン単位結果から paired bootstrap / McNemar と pass^k を計算し、`meanDelta` とともに baseline JSON（git 管理）と比較してゲートする小スクリプト（Δ は exit code に反映されないため必須）。
   - **CLAUDE.md を読まない制約**: 役割規約・SSOT 優先順位はプラグインの skill/agent/hook 本体に置く設計に寄せる（配布形態としても正しい）。設計書は scaffold でファイルとして置く。
   - **GitHub ラベル mailbox**: プラグインに GitHub 操作用 MCP サーバを宣言し mock で評価（`expect:` でラベル名を検証）。`gh` 直叩きは再現性・sandbox 面で不利。
3. **Inspect + inspect_swe を二次に置く理由**: コード grader 自由・Docker sandbox・epochs・ログビューア・MIT・Petri（シナリオ生成＋多次元 judge）と同一基盤で、MAST FM-1.2 系の対抗シナリオや複数モデル/他エージェント（Codex 等）との横断比較を研究的に回せる。Harbor は Terminal-Bench 形式でタスク公開・`regrade` が便利なので、「タスクを外部に公開ベンチとして配る」段階で採用候補。
4. promptfoo は導入最軽量で skill-comparison example があり PoC には良いが、隔離が自前で、Claude Code の plugin/hook ロード経路と一致しない点で一次には推さない。Braintrust/LangSmith は結果の可視化先としては任意（必須ではない）。
5. 運用: PR ごと = 決定論 grader のみ・`--ablation none`・`--runs 3`・閾値ゲート（回帰 eval、~100% 維持）／nightly・リリース前 = `--ablation with-without --runs 5+`・judge あり・バージョン比較（capability eval）／指標 = 平均合格率 + pass^k（役割遵守）+ Δ（95% CI）+ コスト/ターン数（AGENTS.md 研究がコスト増を主要副作用として示したため）+ 発火率（SkillsBench の invocation rate、`/skill-doctor` は実運用側の補助）。
