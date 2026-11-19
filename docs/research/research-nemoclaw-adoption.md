# NVIDIA NemoClaw / NeMo「失敗トレース → テスト → ハーネス修正」blueprint の取り込み可否

作成: 2026-11-11 / 対象: オーナー指示（`docs/log/2026-11-11.md` L4、Issue https://github.com/Takenori-Kusaka/pit-crew/issues/3）の NemoClaw と、NVIDIA ブログ https://developer.nvidia.com/blog/use-nvidia-nemo-to-turn-agent-failures-into-tests-and-harness-fixes/ （2026-11-04、Moorhead / Lopp / Chung）が示す blueprint の実体 / 状態: **調査（インストール・モデル実行なし。GitHub API と公開文書の読解のみ）**
目的との関係: 成果物 2.2（評価結果から改善点を抽出する仕組み）・2.3（セルの作り方）・1.4（アダプタ）。`docs/planning/00-goal-charter.md` L22-25
前の調査との関係: `research-runners.md` §1（Harbor / ATIF の採用理由）と `research-blueprint.md`（genai-evaluation-blueprint）を前提に、**新しい点** = NeMo 3 ライブラリの中身と pit-wall への対応。`research-runners.md` L25 の「NVIDIA SkillEvaluator [未検証]」は本調査でも対象外（eval-author が CI で使うだけ、`docs/harness-datasets.md`）。

凡例: **[一次]** 本文を読んだ / **[二次]** 要約・検索 / **[推論]** / **[未確認]**。★・日付は 2026-11-11 に `gh api` で取得。

## 結論（先に）

1. **`NVIDIA/NemoClaw` リポジトリは blueprint の置き場所ではない。** 中身は OpenShell サンドボックスで OpenClaw / Hermes / LangChain Deep Agents を動かす TypeScript 製 CLI と設定 schema で、Compass / Eval Author / Relay のコードも参照も無い（§1.1）[一次]。オーナーが見た製品ページ https://www.nvidia.com/ja-jp/ai/nemoclaw/ も「自律型エージェントを構築するためのオープンなブループリントのコレクション」で、失敗トレース → テストのループ・Compass・Eval Author・Relay を一語も載せていない [一次]。ブログの実体は **別の 4 リポジトリ**: `NVIDIA-NeMo/nemo-compass`（★22）/ `NVIDIA-NeMo/eval-author`（★12）/ `NVIDIA/NeMo-Relay`（★243）/ 手順と成果物 `NVIDIA/nemoclaw-community/examples/tools/enterprise-assistant-harness-optimization`（§1.2〜1.5）。
2. **ループの骨格は pit-wall と同型だが、構成要素はどれも今の pit-wall の代わりにならない。** Relay は Harbor の外でトレースを取る層（私たちは Harbor が ATIF を出すので変換 0、`packages/pit-wall/src/normalize/atif.mjs` L1-3）。Compass は **LLM で ETHOS.md からの逸脱を見つける発見器**で、決定的採点・arm 比較・保留セル・統計を持たない（§2.2）。Eval Author は **Claude Code / Codex に入れる SKILL.md 9 本**で、ATIF 1 本 + ETHOS.md から **Harbor ネイティブの task（コンテナ内 verifier）**を作る。pit-wall は Harbor task の `tests/test.sh` を状態採取だけに使い採点を外で行う（`packages/pit-wall/src/runners/harbor.mjs` L114-129）ので、**成果物の形が合わない**（§3）。
3. **blueprint の保留（held-out）は機械で守られていない。** 分割も「修正役に見せない」も、Codex へのプロンプトと「新しいセッションで始める」運用に依る（§4）[一次]。pit-wall の「作成役 / 導き直し役を分け、設計者は数だけ知る」（`docs/planning/27-qm-role-evaluation-plan.md` L18・L70）より弱い。
4. **費用面は憲章と衝突する点がある。** Compass は推論 API キーが必須で（`docs/model-access.md`「The CLI requires an inference key before loading traces」）、Anthropic 直 / OpenAI / NVIDIA Build のどれも従量課金。サブスクの OAuth で動く記述は無い [一次]。トレース本文は「設定した推論プロバイダへ送られうる」「自動の秘匿化は無い」と明記 [一次]。Eval Author 自体は私たちの Claude Code の枠で動くが、トレース読み込みに Compass 一式（litellm / scikit-learn / tokenizers / nooa / OTel）の Python 3.12〜3.13 環境が要る（§1.3）。
5. **推奨 = (a) 設計の借用 + (c) ライブラリは今は入れない**（§6）。借りる価値があるのは Eval Author の **candidate 記録（`candidate` / `no_candidate` + 理由コード）・正解の出自（agent の答えは正解ではない）・check ごとの PASS/FAIL 行・採用前の対照必須・課題文へ答えが写せる literal の lint** で、どれも pit-wall 側に同種の芽がある。スパイク (b) は、Eval Author が私たちの ATIF を読めるかの 1 点だけを確かめる限定版にする。

## 1. 実体（何がどこにあるか）

### 1.1 `NVIDIA/NemoClaw`（★23,004 / fork 3,205 / open issues 876 / Apache-2.0 / TypeScript / 作成 2026-03-15 / push 2026-11-11）[一次]

- README: 「open source reference stack for running supported AI agents more safely inside NVIDIA OpenShell sandboxes」「NemoClaw is an alpha project」。対応 agent は OpenClaw（既定）/ Hermes / LangChain Deep Agents Code。https://github.com/NVIDIA/NemoClaw/blob/main/README.md
- `nemoclaw-blueprint/`: `blueprint.yaml`（OpenShell の sandbox image を digest 固定、推論 profile = `default` が `https://integrate.api.nvidia.com/v1` の `nvidia/nemotron-3-super-120b-a12b`、`nim-local` / `vllm` はローカル推論）、`policies/`、`provider-profiles/`、`private-networks.yaml`。**評価・トレース解析の要素は無い**。https://github.com/NVIDIA/NemoClaw/blob/main/nemoclaw-blueprint/blueprint.yaml
- `skills/`: `nemoclaw-user-guide` 1 本のみ（README「NemoClaw currently maintains one customer-facing source skill」）。`src/`: `nemoclaw.ts` + `commands/` `lib/` `lifecycle/`（CLI）。`schemas/`: blueprint / network-policy / sandbox-policy / onboard-config 等 8 本の JSON Schema。`docs/`: 利用者向け（deployment / inference / network-policy / security）。
- release は `ci-native-podman-e2e-2026-10-01` の 1 件のみ。直近 5 commit は 2026-11-10〜11（telemetry / uninstall / Hermes provider 配線）。

### 1.2 `NVIDIA-NeMo/nemo-compass`（★22 / fork 6 / open issues 12 / Apache-2.0 / Python / 作成 2026-09-11 / push 2026-11-10）[一次]

- 位置づけ: 「Research Preview」「not intended for production use」「APIs, configuration, and output formats may change without backward compatibility」。**外部からの issue / PR を受け付けない**（README §Contributing）。release v0.1.0（pre、2026-10-19）→ v0.2.0（10-26）→ v0.2.1（11-06）。PyPI `nemo-compass`、コマンド `compass`。
- 実装: Python パッケージ + CLI（`src/compass/cli/main.py`）。依存 `litellm` / `scikit-learn` / `numpy` / `nooa[tracing]` / `opentelemetry-exporter-otlp-proto-http` / `openinference-instrumentation`（`pyproject.toml`）。
- 5 つの「Compass Signal」（README 表）: 異常検知（Isolation Forest）/ Tool Issues（引数不正・失敗・無駄な再試行を決定的に検査）/ User Sentiment（分類器 + LLM）/ **ETHOS.md Divergence（LLM）** / Grader failures（採点結果の低い trace を LLM で調査）。ETHOS 逸脱は `src/compass/compass_signals/ethos_divergence/ethos_divergence_detector.py` が「Use ETHOS.md as the evaluation contract, even if the agent's system prompt permits behavior the contract forbids」と LLM に指示する純 LLM 検出器。結果は trace ID 付きの ranked insights（YAML）。
- 入力: 独自の canonical JSONL（`schemas/trace.schema.json`、「trace contract v3」）と **ATIF v1.0〜v1.8**（`src/trace_ingest/loaders/atif.py`: 「validated strictly (no type coercion, unknown keys rejected)」「External `trajectory_path` files are not read」）、Langfuse / LangSmith / Braintrust / MLflow / NeMo Gym / NeMo Platform Intake。**ATIF の `extra` に載せた pit-wall の `kind` / `locations`（`atif.mjs` L45）が strict 検証を通るかは [未確認]**（ATIF は `extra` を許すが、loader の unknown-key 判定の範囲を読んでいない）。
- モデル: LiteLLM 経由で OpenAI / Anthropic / OpenAI 互換 gateway。既定値は `openai/azure/openai/gpt-5.6-luna`（gateway 必須）。推奨は Nemotron 3.5 Super VL / Claude Sonnet 5.5 / GPT-6 Luna。blueprint の設定は `nvidia_nim/nvidia/nemotron-3-ultra-550b-a55b` + `https://integrate.api.nvidia.com/v1`（`configs/trace-analyst.yaml`）。**GPU**: 推論は全てリモート。ローカルで動くのは PCA + ロジスティック回帰と、任意の `local-embedding`（torch）だけ → ローカル GPU 不要 [推論、文書に GPU 要件の記述なし]。
- データの行き先（`docs/model-access.md` §Where data goes）: 「Trace content, evaluation signals, and candidate findings may be sent to your configured inference provider」「ETHOS.md … included」「Code validation: Selected source excerpts are sent」「There is no automatic redaction of trace content before analysis」。

### 1.3 `NVIDIA-NeMo/eval-author`（★12 / fork 1 / open issues 25 / Apache-2.0 / 作成 2026-09-15 / push 2026-11-11）[一次]

- 位置づけ: 「Research Preview」。release は v0.1.0（2026-10-05）の 1 件。`KNOWN_ISSUES.md`: 「Generated tasks can be too easy」「Authoring prompts may need iteration」。
- 実装: **SKILL.md 9 本 + 同梱 Python スクリプト**（`pyproject.toml` の `[tool.uv] package = false`「Nothing here installs as a package」）。`skills/eval-author`（入口）/ `-first-eval` / `-task-create` / `-trace-environment` / `-environment` / `-audit` / `-discover` / `-inspect-trace` / `-rubric`。導入は `npx skills add NVIDIA-NeMo/eval-author --skill '*' --agent claude-code|codex|cursor|pi`（`docs/getting-started.md`）。**Ethos skill 3 本（`NVIDIA/skills`）が別途必須**（README §Prerequisites）。
- トレース入力: ATIF / MLflow / NeMo Gym / Intake を **Compass の `trace_ingest` で読む**（`docs/traces.md`「Eval Author never converts traces into ATIF」）。2026-11-10 の commit `9d326c13`「feat(trace-workspace)!: read Compass Trace instead of ATIF」で破壊的変更。`nemo-compass==0.2.1` を pin、「trace contract v3 is not on PyPI yet」のため git revision 固定（`docs/dev-notes/compass-trace-gaps.md` §Packaging）。同文書: 「Loading traces installs Compass's whole analysis stack, including litellm, scikit-learn, tokenizers, nooa and the OpenTelemetry exporter」。Python 3.12〜3.13 必須。dev 依存は `harbor==0.24.0`。
- 出力（Harbor）: `task.toml` / `instruction.md` / `environment/` / `solution/solve.sh`（Oracle）/ `tests/test.sh` が **`/logs/verifier/results` に `<check-id>\tPASS|FAIL` を 1 行ずつ**書き、reward は「全 check PASS のときだけ 1」（`skills/eval-author-trace-environment/references/check-grammar.md`）。同文書の lint: 課題文や環境に逐語で現れる期待値を verifier に書くと `copyable_literal`、構文検査だけの check は `syntax_only_check`。
- 工程（`skills/eval-author-trace-environment/SKILL.md`）: ① 非公開 workspace `.eval-author/.working/trace-environments/<task-id>/`（git 管理外、owner-only）→ ② trace 1 本選択（「never merge unrelated traces, and never invent an instruction, tool result, file, or final answer」）→ ③ 秘匿化した safe copy + privacy audit → ④ **正解の出自の棚卸し**（「An agent answer is not ground truth merely because the trace succeeded」、`available / partial / absent / unknown`）→ ⑤ `candidate` / `no_candidate` の決定（safe trace の turn id を引用）→ ⑥ 構築 → `validate-task` → NOP ×2 / Oracle ×2 + 負の対照 + 代替解 + 依存回避の対照 → 修理は最大 3 回、「Do not weaken the verifier to make Oracle pass」→ 公開前レビュー。
- モデル: スキルを動かす coding agent のモデル（私たちなら Claude Code のサブスク枠）。トレース読み込みはモデル呼び出し無し（`docs/traces.md`「It makes no model calls; only `--source-kind intake` queries a live Intake service」）。GPU 不要。

### 1.4 `NVIDIA/NeMo-Relay`（★243 / fork 112 / open issues 10 / Apache-2.0 / Rust 核 + Python・Node・Go binding / 作成 2026-03-31 / push 2026-11-11）[一次]

- 位置づけ: 「beta software」。release 0.11.1（2026-11-09）、ほかに `1.0.0-alpha.YYYYMMDD` を毎日。
- 実装: `nemo-relay` CLI が **ローカル gateway を立て `ANTHROPIC_BASE_URL` を差し替えてモデル呼び出しを中継**し、tool 呼び出しは **Claude Code の hook**（SessionStart / UserPromptSubmit / PreToolUse / PostToolUse / PostToolUseFailure / SubagentStart / Stop / PreCompact …）で受ける（`integrations/coding-agents/claude-code/README.md` §Captured Events、`hooks/hooks.json`）。Claude Code 2.1.121 以上。Codex も同様の plugin + hooks。OpenClaw / pi / Hermes（native）/ LangChain / LangGraph / Google ADK / deepagents に統合。
- 出力: 独自の **ATOF**（JSONL のイベント列、`docs/reference/atof-event-format.mdx`）、**ATIF**（`[components.config.atif] enabled = true`、`docs/configure-plugins/observability/atif.mdx`）、OpenTelemetry / OpenInference。ブログ https://developer.nvidia.com/blog/tracing-agent-harness-behavior-with-nvidia-nemo-relay/ （2026-09-30）も同じ 3 形式 [二次]。
- 機能はトレース取得より広い: 「Middleware and guardrails can block, sanitize, redact, or rewrite a tool or model call before it runs」（README）。GPU 不要。

### 1.5 blueprint 本体 `nemoclaw-community/examples/tools/enterprise-assistant-harness-optimization`（Apache-2.0）[一次]

- 前提（README 表 / `docs/walkthrough.md` §Prerequisites）: Ubuntu 24.04 + Docker、8 vCPU / 32 GB / 100 GB、**NVIDIA Build の API キー（Compass 用）**、Codex（ChatGPT ログイン）、NemoClaw 0.0.131 / Hermes 0.21.3 / OpenShell 0.1.2 / Harbor 0.22.0、既定モデル Nemotron 3 Ultra（NVIDIA Build）。**GPU 要件の記述なし**。
- 流れ: Hermes を OpenShell で 42 課題実行 → Relay の ATOF → `scripts/convert_atof_for_insights.py` → Compass canonical JSONL（`traces/world-v3/production/insights.jsonl`）→ `compass --config configs/trace-analyst.yaml` → `results/production-insights.yml`（「Agent Sends Messages Without Explicit User Authorization」）→ Codex + Eval Author（`prompts/eval-author-from-traces.md`）→ Harbor task 4 本 + `evals/flywheel-eval-set-v3.json` → 開発 2 / 保留 2 に分割 → baseline 3 回ずつ → Compass を再実行 → **新しい Codex セッション**が `profiles/candidate-soul.md` を提案 → candidate を開発・保留で 3 回ずつ → `scripts/compare_harbor_jobs.py`（Wilson 区間）。結果: 開発 3/6 → 6/6、保留 4/6 → 6/6（`docs/results.md`）。同文書の自己申告: 「Three attempts per task do not establish statistical significance」「a protocol holdout, not an unseen production distribution」。
- 生成された verifier の実物（`evals/harbor-tasks-v3/approval-compose-launch-evidence/tests/verify.py` + `tests/expected.json`）: `/logs/artifacts/final-answer.txt` と **host 側 MCP の呼び出しログ `tool-calls.jsonl`** を読み、`required_tools` / `forbidden_tools`（`actions.send_message`）/ `required_fact_groups` / `forbidden_claims`（「has been sent」等）/ `max_tool_calls`（12）/ `outbox_count` を決定的に判定、`reward.txt` に 0/1、行 `task-success\tPASS|FAIL`。LLM judge なし。

## 2. pit-wall への対応

| 構成要素 | pit-wall 側の相当物 | 向こうが足すもの | 向こうに無いもの | 判定 |
|---|---|---|---|---|
| **Relay**（hook + gateway で ATOF/ATIF/OTel） | `normalize/atif.mjs`（Harbor の ATIF を読み `extra.kind` / `locations` を付与、L39-48）。Harbor が ATIF を書くので変換 0（`research-runners.md` L18・L76） | Harbor の**外**（開発者の実セッション）のトレース取得。モデル呼び出しの遮断・書き換え | 私たちの採点に必要な gh の効果・最終ツリーのハッシュ（`runners/state-capture.sh`）は Relay の範囲外 | **不採用（今は）**。本番のハーネス運用のトレースを取る段になったら候補。導入は Rust バイナリ + `ANTHROPIC_BASE_URL` の差し替えで、サブスク OAuth が gateway 経由で通るかは [未確認] |
| **Compass**（LLM の ETHOS 逸脱 + 統計 signal） | B 系列（`graders/process/phases.mjs` L1-15 / `review-phases.mjs` L1-13: Declare 型の存在・先行制約、事実はセルが登録し agent の文は使わない）、`validity.mjs`、`stats.mjs` | **大量トレースからの未知の問題の発見**（ETHOS.md 1 枚で、規則を事前に採点器に落とさずに探す）。Tool Issues の決定的検査（引数不正・無駄な再試行） | 決定性 / arm の対比 / 保留セル / 区間と三値判定 / 作成役の独立。出力は人のレビュー前提（ETHOS.md「A reviewer can check each finding against its cited traces」） | **不採用**。私たちのセルは事故の型が既知で害の述語も登録済み。発見器が要るのは「規則を知らない大量の実運用トレース」で、pit-crew はまだそこにいない。API キー必須で憲章 L46 と衝突。借りるなら「Tool Issues」の決定的検査の着想を validity fault に |
| **Eval Author**（SKILL.md で ATIF + ETHOS.md → Harbor task） | 作成役 teammate が事故カタログから `suite.yaml` + fixture + checks を書き、導き直し役が独立に正解を導く（`27-qm-role-evaluation-plan.md` L18）。`pit-wall lint`（答えの漏れ）・`controls`（台本の対照）・`leak`（`README.md` §Checking a case） | 工程の**型**: candidate 記録と理由コード、正解の出自（agent の答え ≠ 正解）、check 単位の PASS/FAIL 行、`copyable_literal` lint、NOP/Oracle ×2 + 負の対照の受け入れ条件、修理 3 回上限 | 導き直し役（独立）、arm 対比、保留の機械的分離、私たちの `history:` / `.github-cache/` / gh 偽物の採点（§3） | **設計を借用**。そのまま入れると成果物が Harbor ネイティブ task になり pit-wall のセルにならない（§3） |

## 3. Eval Author を「ATIF + 規範文 → セルの足場」のスキルとして使えるか

- **それは何か**: はい、`eval-author-task-create` の「trace source mode」と `eval-author-trace-environment` は「recorded interaction 1 本 + ETHOS.md → Harbor task（instruction / environment / verifier / Oracle）」を作る Claude Code / Codex のスキルである [一次]（§1.3）。入力は ATIF を含む 4 形式。
- **私たちの Harbor task の形と合わない**: pit-wall の `compile()` は自前の `task.toml`（`harbor.mjs` L27-59）、`instruction.md` = セルの `prompt`、`tests/test.sh` = `state-capture.sh`（状態採取のみ）、Oracle = `scripts.<name>` を書き（L114-133）、採点は `grade()`（`graders/index.mjs`）が trajectory + 採取状態に対して行う。Eval Author の task は verifier をコンテナ内 `tests/` に持ち reward 0/1 を返す。**同じ Harbor だが層が違う**: 向こうは「Harbor の reward が採点」、こちらは「Harbor は実行器、採点は pit-wall」。
- **落とし込むなら変換が要る**: `instruction.md` → `params.request`、`environment/` の初期ファイル → `history[].files` / `extra_files`（`suites/incidents/suite.yaml` の形）、`tests/verify.py` の `forbidden_tools` / `required_facts` → `expect.task.check` / `conventions[].check` の shell、`solution/solve.sh` → `scripts.reference`、NOP → `scripts.null`。手で 1 セル 1〜2 時間 [推論]。向こうの verifier が読む `tool-calls.jsonl`（MCP の host 側ログ）は、私たちの `/tmp/pitwall-gh-state.tsv`（gh 偽物の効果）と同じ「効果で判定」の思想（`README.md` §Judge by effects）で、述語の種類（禁止呼び出し・必須呼び出し・回数上限・最終発言の必須語 / 禁止語）はそのまま写せる。
- **作成役 + 導き直し役の工程に挿せるか**: 作成役の手順書として SKILL.md の工程（§1.3 ①〜⑥）を**真似る**ことはできる。ただし Eval Author が止まる所は「人のレビュー」であり、独立の導き直しは無い。私たちの「割れたセルは直さず作り直す」（L18）は向こうに無い。
- **要らない重さ**: 秘匿化と privacy audit は合成 fixture のセルには不要。トレース読み込みに Compass 一式の Python 環境が要る（§1.3）。Ethos skill 3 本が前提。`harbor==0.24.0` pin と私たちの Harbor 0.25.0（Issue #3 本文）の相性は [未確認]。

## 4. 危険

| 危険 | 根拠 | pit-crew への影響 |
|---|---|---|
| ベンダー結合（Compass Trace contract v3 への移行） | eval-author は ATIF を捨て Compass Trace を唯一の入力に（`9d326c13`、`feat!`）。contract v3 は PyPI 未公開で git revision pin | ATIF を正本にする pit-wall（`02-design.md` L146）と逆方向。将来 ATIF loader が外れる可能性 |
| Python 3.12〜3.13 の第 2 スタック | eval-author / compass の `requires-python` | Node + shell の pit-wall に Python 環境管理（uv）が増える。WSL のメモリ逼迫（`00-goal-charter.md` L47）に torch 任意依存が乗る |
| トレース形式の lock-in | Compass canonical JSONL は独自（`docs/sources/files.md`）。Relay は ATOF 独自 | 外殻 ATIF の方針（`research-runners.md` §推奨）を保てば影響は小 |
| **データ流出** | Compass: 「no automatic redaction」「may be sent to your configured inference provider」。blueprint の既定 endpoint は NVIDIA Build | 憲章 L45「会社の情報…をリポジトリに入れない」の精神に照らすと、GQ の事故から抽象化したセルのトレースを第三者 API に送る判断が要る。合成 fixture なら実害は小 [推論] |
| **追加の支払い** | Compass は推論キー必須（§1.2）。NVIDIA Build の無料枠の有無・規約は [未確認] | 憲章 L46 に抵触。Eval Author / Relay 自体は無料 |
| Nemotron のライセンス | NVIDIA Nemotron Open Model License（OSI 非承認）、API 利用は NVIDIA API Trial Terms [二次: https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-super-120b-a12b ] | ツール 4 本は Apache-2.0。Nemotron を使わなければ無関係 |
| **保留の漏れ** | 分割は Codex に頼み `case_kind` を付けるだけ（`walkthrough.md` §Hold-out set）。開発・保留が同じ `suite.json` に同居。修正役への遮断は「Start a new coding agent session with fresh context」と「Do not read held-out case fields」のプロンプト。`evals/REVIEW.md` は保留課題文を含み「Keep this sheet out of the candidate-design coding session」と注意書き | 私たちの「作成役が型を選び設計者は数だけ知る」（L70）・リポジトリ内の分離の方が強い。借りない |
| 成熟度 | compass ★22 / eval-author ★12、両方「Research preview」、compass は外部 issue / PR を受けない。eval-author v0.1.0 1 件、`KNOWN_ISSUES` に「tasks can be too easy」 | 依存したら私たちが追従コストを払う。借用（写し）なら影響なし |

## 5. 向こうの結果を私たちの基準で読むと

- 4 課題 × 3 回 × 2 arm = 24 試行で「6/6」。`docs/results.md` 自身が有意性を否定。pit-wall の三値判定（`02-design.md` L203-211）なら「判定不能」で報告する規模。
- 保留は同じ 42 課題の母集団から選んだ 2 本（「protocol holdout」）。私たちの EXP-30 で見た「保留で差が出ない」問題（`00-goal-charter.md` L58）への答えは blueprint にも無い。

## 6. 推奨（案 3 つと最初の一歩）

**推奨は (a) + (c)。** (b) は (a) の判断材料が足りないときだけ。

| 案 | 内容 | 最初の一歩 | 見積 | 憲章との整合 |
|---|---|---|---|---|
| **(a) 設計を借りる** | 作成役の手順書（pit-wall 側 SKILL.md または `docs/planning/` の作成役テンプレ）に Eval Author の 5 点を写す: ① `candidate` / `no_candidate` + 理由コードの記録 ② 正解の出自（`trace_turn` / `external` / `none`、agent の答えは正解ではない）③ check 単位の PASS/FAIL 行（私たちは `checksScript` が `name\tcode` を出す、`harbor.mjs` L91-92。既に同型）④ 受け入れ条件 = `script:null` 落ち・`script:reference` 通り・`shortcut` / `harmful` が狙い通り（`pit-wall controls` を必須化）⑤ 課題文に逐語で現れる期待値の lint（`pit-wall lint` の拡張） | `27-qm-role-evaluation-plan.md` §1 の「セルを作る」行に ①② の記録項目を足し、`suite.yaml` schema に `provenance` を任意項目で追加。CI で `controls` を必須化 | 4〜8 h | 支払いなし・データ流出なし |
| **(b) 限定スパイク** | Eval Author の `trace-environment` を **私たちの ATIF 1 本**（新しく回した pit-wall run の `trajectory.json`、`runs/` の既存物は使わない）に Claude Code で当て、(i) `extra.kind` 付き ATIF が Compass loader の strict 検証を通るか (ii) 出てくる verifier を §3 の変換表で `checks` に写せるか、の 2 点だけ確かめる。Harbor 実行はしない（NOP/Oracle proof は省く） | uv で Python 3.13 の隔離環境に `nemo-compass==0.2.1` を入れ、`trace_environment.py prepare --source-kind atif` を 1 回 | 4〜6 h（Python 環境 1 h・Ethos skill 導入 0.5 h・読解 2 h） | Claude の枠は使う（既存サブスク）。Compass の推論キーは `prepare` には不要（モデル呼び出し無し、§1.3） |
| **(c) 今は入れない** | Compass / Relay / NemoClaw 本体は導入しない。Issue #3 に本調査を貼り「再評価トリガ」を書いて置く | トリガ案: ① ハーネスを実運用して規則の外のトレースが月 100 本を超えた（Compass）② Harbor の外で Claude Code の実セッションを採点する必要が出た（Relay）③ eval-author が ATIF 入力を PyPI 版で安定させた、または pit-wall 側で Harbor ネイティブ verifier を採用する判断をした（Eval Author 本体） | 0.5 h | — |

**(a) を先にする理由**: 向こうの価値はコードではなく「セルを作る工程の型」にあり、それは写せば済む。コードを入れると Python 環境・contract v3 への追従・保留の運用の弱さを一緒に引き取る。NemoClaw 本体（OpenShell サンドボックス運用）は pit-crew の目的（評価済みハーネスの公開）に対して別の問題を解いている。

## 7. 未確認のまま残すこと

- pit-wall の ATIF（`extra.pitwall`、tool_call の `extra.kind` / `locations` / `denied` / `result`）が Compass の strict loader を通るか（(b) で確かめる）
- NVIDIA Build API の無料枠と規約（Compass を使う判断をするときに読む）
- Relay の gateway がサブスクの OAuth（`claude setup-token`）で通るか
- `harbor==0.24.0` pin と 0.25.0 の互換
- `claude plugin eval` との関係（eval-author は Harbor / NeMo Gym のみ対応、`research-runners.md` §2 の一次バックエンドには触れない）
