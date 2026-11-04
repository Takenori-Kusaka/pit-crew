> **検証メモ（2026-10-31 追記）**: 本レポートのうち次の 2 点は誤りだったため、実際に確かめて訂正した。
> (1) `claude plugin eval` には公式の文書がある（https://code.claude.com/docs/en/plugin-evals → HTTP 200）。Bash を許可すると、コマンドは OS レベルの sandbox の中で実行され、ネットワークも許可したドメインに限られる（同文書）。
> (2) skillarena は実在する（`gh api repos/caioagiani/skillarena` → ★1、MIT、2026-10-12 push）。

# pit-wall 可搬性調査: OSS ランナー / 認証経路 / 軌跡フォーマット / ルール注入（2026-10-31）

凡例: **[未検証]** = 一次情報で確認できなかった、または推測。stars / 最終 push / license は `gh api repos/<owner>/<repo>` で 2026-10-31 に取得した値。

---

## 1. ランナー別の比較

### 1.1 一覧表

| ランナー | 駆動できる agent | Bedrock / Vertex / ローカル model | sandbox | Windows | license / ★ / 最終 push | 正規化された軌跡 |
|---|---|---|---|---|---|---|
| **Inspect AI + inspect_swe** | Claude Code, Codex CLI, Gemini CLI, Kimi Code, OpenCode, mini-SWE-agent（ACP 版 interactive_* もある） | **あり（間接）**。CLI の API 呼び出しを sandbox 内の proxy が受け、Inspect の model へ中継する。Inspect は `anthropic/bedrock/…`、`anthropic/vertex/…`、`ollama/`、`vllm/`、`openai-api/` に対応 | Docker 等の sandbox が必須。配布バイナリは linux-x64/arm64 のみ | **[未検証]** Docker Desktop の Linux コンテナなら動くはず（推測） | MIT / inspect_ai ★3,144・inspect_swe ★40 / どちらも 2026-10-30 | **あり**。Inspect の eval log（model event + tool call）。CLI のネイティブな tool call は model 応答の中の tool_use として記録される |
| **Harbor** | 41 agent。claude-code, codex, gemini-cli, copilot-cli, cursor-cli, opencode, goose, aider, openhands, cline-cli, qwen-coder, kimi など | claude-code は **Bedrock をネイティブに扱う**（`CLAUDE_CODE_USE_BEDROCK` / `AWS_BEARER_TOKEN_BEDROCK` をコンテナに渡す実装がある）。Vertex は **[未検証]**。`--ae` で任意の env を渡せる | Docker（既定）/ Podman / Daytona / Modal / E2B / GKE / EC2 / Vercel など | **Windows コンテナで動くのは `nop` / `oracle` のみ**。実 agent は Linux コンテナで動く | Apache-2.0 / ★6,653 / 2026-10-31 | **ATIF v1.8**（`trajectory.json`）。約 33 agent が出力する |
| **promptfoo** | Claude Agent SDK、OpenAI Codex SDK / app-server、OpenCode SDK、Open Interpreter、OpenAI Agents。それ以外は `exec:` / Python / JS のカスタム provider で包む | Claude Agent SDK provider は **Bedrock / Vertex を公式に記載**（`CLAUDE_CODE_USE_BEDROCK` / `CLAUDE_CODE_USE_VERTEX`）。素の model provider は Bedrock / Vertex / Ollama など多数 | sandbox ではない。`copy_working_dir` で呼び出しごとに使い捨ての workspace を作る（文書自身が「it isn't a sandbox」と書いている） | Node 製なので動く見込み **[未検証]** | MIT / ★26,658 / 2026-10-31 | OTLP tracing を取り込み、`trajectory:tool-used` / `tool-args-match` / `tool-sequence` / `step-count`、`skill-used` で検査する |
| **vercel-labs/agent-eval** | claude-code, codex, gemini, cursor, opencode, fx, pi-coding-agent。`registerAgent` で追加可能。Copilot は記載なし | 推奨経路は Vercel AI Gateway。直接の API key（`ANTHROPIC_API_KEY` 等）も可。Bedrock / Vertex の記載なし **[未検証]** | Vercel Sandbox（Firecracker）または Docker | 記載なし **[未検証]** | package.json は MIT（repo 直下に LICENSE が無く GitHub 上は none）/ ★275 / 2026-10-20 | **一部あり**。`TranscriptSummary`（`filesRead` / `filesModified` / `toolCalls` / `totalToolCalls` / `usage`）と `transcript.json`。raw はネイティブ形式 |
| **Caliper** (edonadei) | Claude Code, Codex, Pi, Hermes | 各 CLI の設定次第。「direct-API backend は無い」。Bedrock の明記は無いが、CLI 側を Bedrock に設定すれば通る見込み **[未検証]** | Docker なし。試行ごとに一時 HOME と空の workdir を使う | 記載なし **[未検証]** | MIT / ★227 / 2026-10-27 | 試行ごとに transcript を保存。schema は docs/results.md にあり、本調査では未読 **[未検証]** |
| **skill-eval-harness** (adewale) | Claude（`claude -p --output-format stream-json`）、Codex（`codex exec --json`）、Gemini CLI、Mistral Vibe、Pi、Jetty。任意の CLI を `--agent-cmd` で | 記載なし **[未検証]** | Gemini / Vibe は隔離した HOME。Gemini は deny-by-default の policy | 記載なし | MIT / ★79 / 2026-10-09 | **あり**。`events.json`（「normalized events used by process assertions」）、`trace.jsonl`、`metrics.json`。field 単位の schema は未掲載 |
| **langchain-ai/skills-benchmarks** | Claude Code のみ | `ANTHROPIC_API_KEY` のみ記載 | Docker 必須 | 記載なし | MIT / ★119 / 2026-09-21 | `events/` に parse 済み event、LangSmith trace |
| **skillgrade** (mgechev) ※追加 | Gemini CLI, Claude Code, Codex CLI, OpenCode, 任意の ACP agent, 任意のコマンド | API key から自動判定。Bedrock 記載なし | Docker または local（CI では local を推奨） | 記載なし | MIT / ★734 / 2026-10-11 | session transcript を LLM grader が読む。正規化 schema は記載なし |
| **NVIDIA SkillEvaluator** ※追加 | Claude Code, Codex CLI ほか（二次情報） | **[未検証]** | **[未検証]** | **[未検証]** | Apache-2.0 / ★616 / 2026-10-30 | **[未検証]** |
| **skillarena** | — | — | — | — | — | **見つからなかった**。GitHub 検索と Web 検索で該当する repo は無い。名前の取り違えの可能性がある |

### 1.2 一次情報

- inspect_swe 概要: https://meridianlabs-ai.github.io/inspect_swe — 「makes software engineering agents like Claude Code, Codex CLI, Gemini CLI, Kimi Code, OpenCode, and Mini SWE Agent available as standard Inspect agents」
- inspect_swe reference（`skills` / `mcp_servers` / `system_prompt` / `home_dir` / SandboxPlatform は linux のみ / ACP 版）: https://meridianlabs-ai.github.io/inspect_swe/reference
- Agent Bridge（「a proxy server inside the sandbox container which receives requests for the OpenAI, Anthropic, and Google APIs」「All model calls are captured and produce the same transcript output」）: https://inspect.aisi.org.uk/agent-bridge.html
- Inspect provider（`anthropic/bedrock/<model>`、`anthropic/vertex/<model>`、`ollama/`、`vllm/`）: https://inspect.aisi.org.uk/providers.html
- Harbor の pre-integrated agents と capability 表（ATIF / Skills / MCP / Windows = nop, oracle）: https://docs.harborframework.com/agents/pre-integrated-agents
- Harbor claude-code の Bedrock 実装: https://github.com/harbor-framework/harbor/blob/main/src/harbor/agents/installed/claude_code.py （`env["CLAUDE_CODE_USE_BEDROCK"] = "1"`、`AWS_BEARER_TOKEN_BEDROCK` の受け渡し、skills を `$CLAUDE_CONFIG_DIR/skills/` へコピー）
- Harbor の sandbox 一覧: https://docs.harborframework.com/sandboxes/pre-integrated-sandboxes ／ https://github.com/harbor-framework/harbor/blob/main/AGENTS.md
- Harbor の skills（「Compatible pre-integrated agents then copy or register the skills in their native configuration directory」）: https://docs.harborframework.com/tasks/skills
- promptfoo の coding agent ガイド: https://www.promptfoo.dev/docs/guides/evaluate-coding-agents
- promptfoo Claude Agent SDK（Bedrock / Vertex、`setting_sources`、`skills`）: https://github.com/promptfoo/promptfoo/blob/main/site/docs/providers/claude-agent-sdk.md
- promptfoo の assertion（`trajectory:*`、`skill-used`）: https://github.com/promptfoo/promptfoo/blob/main/site/docs/configuration/expected-outputs/deterministic.md
- agent-eval README（TranscriptSummary、agent 一覧、sandbox）: https://github.com/vercel-labs/agent-eval
- Caliper: https://github.com/edonadei/caliper
- skill-eval-harness: https://github.com/adewale/skill-eval-harness
- skills-benchmarks: https://github.com/langchain-ai/skills-benchmarks
- skillgrade: https://github.com/mgechev/skillgrade
- SkillEvaluator（二次情報）: https://skillsllm.com/skill/skillevaluator

### 1.3 補足

- **Inspect の強み**: agent CLI は「Anthropic API と話しているつもり」のまま、実際の推論は Inspect が選んだ provider（Bedrock / Vertex / Azure / Ollama）で行われる。企業が「Anthropic 直の API 禁止、Bedrock のみ可」という条件でも Claude Code を評価に使える。注意点として、bridge 経由だと provider 依存の tool（web_search 等）は保留される。また「Codex CLI + Claude on Bedrock」のような組み合わせは bridge の model alias 次第で、組み合わせごとの動作は **[未検証]**。
- **Harbor の強み**: 対応 agent の数（Copilot CLI と Cursor CLI を含む）と、ATIF による軌跡の正規化。弱み: Docker 等のコンテナが前提で、Windows 実機の agent は対象外。
- **promptfoo**: CI 統合と assertion DSL は成熟している。ただし coding agent はほぼ SDK 型（Claude Agent SDK / Codex SDK / OpenCode SDK）に限られ、Gemini CLI / Copilot CLI は自前で `exec:` provider を書く必要がある。

---

## 2. `claude plugin eval` / Claude Code headless と Bedrock / Vertex

- **Claude Code 本体（headless を含む）**: `CLAUDE_CODE_USE_BEDROCK=1`（+ `AWS_REGION`、AWS 認証チェーン、または `AWS_BEARER_TOKEN_BEDROCK`）で Bedrock を使える。Mantle endpoint は `CLAUDE_CODE_USE_MANTLE`。Bedrock では WebSearch tool が使えず、`/logout` も無い。出典: https://code.claude.com/docs/en/amazon-bedrock
- **headless**: 公式の headless ドキュメントに「Amazon Bedrock, Google Cloud's Agent Platform, and Microsoft Foundry continue to read their own provider credentials as usual」とある（https://code.claude.com/docs/en/headless.md）。`--output-format stream-json` が Bedrock / Vertex で動くと明記した記述は無い。provider に依存しない機能と読めるが、これは推測 **[未検証]**。
- **Claude Agent SDK**: promptfoo の公式文書が `CLAUDE_CODE_USE_BEDROCK` / `CLAUDE_CODE_USE_VERTEX` での利用を明記している（上記 promptfoo の URL）。
- **`claude plugin eval`**: **公開ドキュメントのページはまだ無い**（Claude Code の docs map 自体が「no public docs page yet」と明記。参考: https://github.com/Piebald-AI/claude-code-system-prompts/blob/main/system-prompts/data-claude-code-live-documentation-sources.md ）。以下は Claude Code に同梱された reference（公開 URL なし）による:
  - 「Generally available: on by default for every user on every provider (first-party, Bedrock/Vertex/Foundry, LLM gateways / custom `ANTHROPIC_BASE_URL`, telemetry-disabled clients, CI)」→ **Bedrock / Vertex / Foundry でも動く**。
  - sandbox は、試行ごとに使い捨ての workspace と新しい `CLAUDE_CONFIG_DIR` / `HOME` を用意し、テスト対象の plugin だけを読み込む。「Not an OS sandbox; network is not blocked.」Docker は不要。
  - provider の認証 env は sandbox に引き継がれる。ただし `ANTHROPIC_MODEL` は引き継がれないので `--model` で固定する。
  - 制限: レポートの自動公開（claude.ai artifact）は Bedrock / Vertex / Foundry / API key 認証では使えない。サーバ側の kill switch は 3P provider には届かない。
  - grader は `regex` / `tool_used` / `tool_order` / `file_exists` / `llm` / `baseline`。mock MCP は `mocks/<server>/<tool>.md`。結果は `results/<ts>/aggregate-result.json`（`schemaVersion`、`cases[].arms.{with,without}[].graders[]`）。
  - **[未検証]**: Windows / WSL での動作、CLAUDE.md 単体（plugin ではない rule セット）を評価できるか、結果 JSON に transcript 全文が入るか。
- **結論**: 「Claude は Bedrock / Vertex 経由でのみ許可」という企業でも、plugin eval を一次バックエンドに使える見込みが高い。ただし根拠は非公開の同梱 reference なので、**採用前に Bedrock 環境で実機確認が必須**。

---

## 3. 軌跡 / transcript の標準フォーマット

| 候補 | 状態 | 対象 | pit-wall から見た評価 |
|---|---|---|---|
| **ATIF**（Harbor） | v1.8 Active（2026-04）。v1.0〜v1.8 を受理する | 1 回の agent 実行の完全な履歴。`steps[]`（`source` は system / user / agent、`message`、`reasoning_content`、`tool_calls[]`（`tool_call_id` / `function_name` / `arguments`）、`observation.results[]`（`source_call_id`））、`final_metrics`、`subagent_trajectories`、各階層に `extra` | **最有力**。約 33 agent が出力し、Harbor が validator を持つ。NVIDIA も寄稿している。ただし**ファイル操作専用の型は無く**、tool call として表現される（tool 名は agent ごとに違う）。Harbor の外での採用は spec に記載が無い |
| **ACP**（Agent Client Protocol） | v1。Apache-2.0 / ★4,549 | エディタ ↔ agent の JSON-RPC。`tool_call` に **`kind`**（read / edit / delete / move / search / execute / think / fetch / other）、`status`、`locations[{path,line}]`、`diff{path,oldText,newText}` | **ファイル I/O の意味付けが最も優れている**。軌跡ファイルではなくライブのプロトコルなので、記録するには録画用のクライアントが要る。Gemini CLI（`--acp`）、Copilot CLI（`--acp`）、Claude Code / Codex は adapter（`claude-agent-acp` / `codex-acp`）、goose / OpenCode が対応 |
| **OpenTelemetry GenAI semconv** | **全要素が Development**。v1.42.0（2026-06-12）で専用 repo に移った | span `invoke_agent` / `chat` / `execute_tool`、`gen_ai.*` 属性。MCP の span 規約もあり、MCP tool call は `execute_tool` と整合する | 観測基盤（Langfuse / Honeycomb / MLflow / promptfoo の tracing）との接続には有効。仕様が不安定で、内容の記録は opt-in。grader の入力にするには情報が粗い |
| Claude Code `stream-json` / Codex `exec --json` / Gemini `--output-format stream-json` / Copilot `--output-format json`（JSONL） | 各ベンダー独自 | — | 正規化前の生データ。adapter で変換する対象 |

出典:
- ATIF のドキュメント: https://docs.harborframework.com/agents/atif ／ RFC: https://github.com/harbor-framework/harbor/blob/main/rfcs/0001-trajectory-format.md
- ACP の tool call: https://agentclientprotocol.com/protocol/tool-calls ／ 概要: https://agentclientprotocol.com/overview/introduction
- OTel GenAI agent span: https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-agent-spans.md ／ repo: https://github.com/open-telemetry/semantic-conventions-genai ／ 状況のまとめ（二次情報）: https://genalphai.com/agent-observability-with-opentelemetry-genai-conventions
- Gemini CLI `--output-format`: https://geminicli.com/docs/reference/configuration
- Copilot CLI `--output-format json`（JSONL）、`--acp`: https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference ／ https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference
- Codex `exec --json`（skill-eval-harness 経由で確認）: https://github.com/adewale/skill-eval-harness

---

## 4. 非 Claude agent に「テスト対象の skill / rule セット」を読み込ませる方法

| agent | 常時読まれる rule ファイル | skills（agentskills.io 形式の SKILL.md） | 評価時の注入方法 |
|---|---|---|---|
| Claude Code | CLAUDE.md（v2.1.277 以降は CLAUDE.md が無い project で AGENTS.md も読む） | `.claude/skills/`、plugin | plugin eval は plugin 単位。Harbor は `$CLAUDE_CONFIG_DIR/skills/` へコピー。inspect_swe は `skills=` |
| Codex CLI | AGENTS.md（project と `$CODEX_HOME/AGENTS.md`） | `.agents/skills/` | inspect_swe `codex_cli(home_dir=…)` が「AGENTS.md, skills, and the MCP configuration will be written」。Harbor は `--ak config=…toml` |
| Gemini CLI | GEMINI.md（`context.fileName` で名前を変えられる。AGENTS.md も指定可） | `.gemini/skills/`、`/skills enable` | `GEMINI_CLI_HOME` で隔離（skill-eval-harness）。inspect_swe `skills=` |
| Copilot CLI | `.github/copilot-instructions.md`、`.instructions.md`、**AGENTS.md / CLAUDE.md / GEMINI.md も読む**、`COPILOT_CUSTOM_INSTRUCTIONS_DIRS` | SKILL.md（CLI / cloud agent / VS Code で共通） | `--no-custom-instructions` で無効化できる → baseline の arm を作れる |
| OpenCode / Cursor / goose 他 | AGENTS.md 系 | `npx skills` で 80 以上の agent に配布できる | Harbor `skills_dir`、agent-eval `disableBundledSkills` |

出典:
- Copilot CLI の custom instructions（AGENTS.md / CLAUDE.md / GEMINI.md / `COPILOT_CUSTOM_INSTRUCTIONS_DIRS`）: https://docs.github.com/enterprise-cloud@latest/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions
- Copilot の skills: https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills ／ https://docs.github.com/en/copilot/concepts/customizations/agent-skills
- Gemini CLI GEMINI.md / `/skills`: https://geminicli.com/docs/reference/configuration ／ https://geminicli.com/docs/reference/commands
- Codex の Bedrock provider と `--oss`（Ollama / LM Studio）: https://developers.openai.com/codex/config-advanced.md
- agentskills.io（Anthropic が策定したオープン標準）: https://agentskills.io
- agent ごとの skill パス一覧: https://github.com/vercel-labs/skills
- Claude Code の AGENTS.md フォールバック（二次情報）: https://hidekazu-konishi.com/entry/cli_coding_agents_comparison.html **[一次未検証]**
- Copilot の企業向け BYOK（Anthropic / AWS Bedrock / OpenAI 互換。Copilot CLI でも使える、public preview）: https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/enable-custom-models

**示唆**: SKILL.md は事実上の共通形式になっている。違いは「置き場所」と「常時読まれる rule ファイルの名前」だけなので、pit-wall のケースは中立の `rules/`（本文）と `skills/`（SKILL.md）を持ち、adapter が agent ごとのパスとファイル名（CLAUDE.md / AGENTS.md / GEMINI.md / copilot-instructions.md）に**実体化（materialize）**すればよい。baseline の arm は「実体化しない」か、`--no-custom-instructions` のような無効化フラグで作る。

---

## 推奨: 一次/二次バックエンドと正規化フォーマット

**一次バックエンド: `claude plugin eval`（Claude 系 / Claude Code が許可される環境）**
- Bedrock / Vertex / Foundry / gateway でも GA（同梱 reference による。実機での確認が前提条件）。mock MCP と with / without arm を標準で持つ。
- 制約: 評価単位が plugin。CLAUDE.md 単体の評価は **[未検証]**。transcript 全文の取得も **[未検証]**。→ pit-wall 側で `trace` を読む adapter を書く。

**二次バックエンド（ベンダー中立・企業向け）: Harbor**
- 理由: Copilot CLI / Cursor CLI / Codex / Gemini / OpenCode / goose を含む 41 agent に対応。claude-code の Bedrock をネイティブに扱う。`skills_dir` で skill を配布できる。**ATIF を出力するので grader の入力が揃う**。Apache-2.0 で非常に活発（★6.6k、前日に push）。
- トレードオフ: コンテナ（Docker / Podman / クラウド sandbox）が必須で、Windows ネイティブの agent は評価できない（Windows 開発者は WSL2 + Docker で回す）。tool 名は agent ごとに違う。Copilot CLI を動かすには `COPILOT_GITHUB_TOKEN` が要る（企業のポリシー次第）。

**三次（研究・閉域向けの選択肢）: Inspect AI + inspect_swe**
- 「Anthropic 直の API 禁止、ただし Bedrock / Vertex / 社内 vLLM は可」という環境で、bridge により Claude Code / Codex / Gemini CLI を任意の provider で動かせる唯一の経路。eval log の viewer も強力。
- トレードオフ: Copilot / Cursor には非対応。inspect_swe は ★40 と小さい。bridge が API を仲介する以上、ベンダー本来の挙動（サーバ側 tool、キャッシュ）と完全には一致しない。

**promptfoo** は「バックエンド」ではなく、CI の報告層 / 任意の reporter として位置づける（SDK 型の agent しか native に扱えないため）。Caliper / skill-eval-harness / skillgrade は設計の参考にとどめる（★が少なく、正規化 schema が非公開か未整備）。

**正規化フォーマット: 「ATIF v1.8 を外殻に、ACP の `kind` / `locations` / `diff` を `extra` に載せる」pit-wall トレース**
- ATIF を採用する理由: 実装済みの出力元が最も多い。validator がある。subagent と metrics を表現できる。Harbor バックエンドなら変換コストがゼロ。
- 足りない部分を ACP の語彙で補う: grader に必要なのは「どのファイルを読んだか / 書いたか」と「mock MCP の呼び出し」。ATIF にはそのための型が無いので、各 `tool_call.extra` に `{kind: read|edit|execute|…, locations: [...], diff: {...}, mcp: {server, tool}}` を adapter が付与する。agent ごとの tool 名（Read / read_file / view など）を ACP の `kind` に寄せる対応表は pit-wall が持つ。
- OTel GenAI は**出力先**（観測基盤への export）としてだけ対応し、grader の入力にはしない（仕様が Development で不安定、内容の記録が opt-in）。
- トレードオフ: ATIF も v1.x で動いている（1.6〜1.8 で項目が増えた）ので、`schema_version` を固定し、変換テストを持つ必要がある。`extra` は ATIF の外の独自拡張になるため、他ツールとの相互運用は外殻部分に限られる。
