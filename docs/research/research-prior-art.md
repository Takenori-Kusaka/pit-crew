# 先行事例調査: Claude Code 役割分離ハーネスの配布 × skill の定量評価（コミュニティ編）

調査日: 2026-10-31 / 対象外（別エージェント担当）: `claude plugin eval` / skill-creator eval mode / SkillsBench 論文 / Inspect AI・promptfoo 等の汎用フレームワーク
メタデータ（★・最終 push・ライセンス）は 2026-10-31 に `gh api repos/<owner>/<repo>` で取得した実測値。**[未検証]** は一次ソースを開いて確認していない、または数値の出所が二次情報のもの。

---

## 1. Claude Code の skill / CLAUDE.md / subagent / ハーネス設定を評価するリポジトリ

### 1-1. caioagiani/skillarena — 最も計画に近い「with/without × 複数試行 × CI」ツール
- URL: https://github.com/caioagiani/skillarena （★1 / push 2026-10-12 / MIT）。npm `skillarena`
- **測るもの**: hidden test による pass rate、baseline との差（タスク単位の paired bootstrap 95% CI。CI が 0 を跨がない時だけ「効く/害する」）、**false "done"**（完了と言ったが hidden test 失敗）、**test 改竄**（触るなと言ったファイルの編集。採点前に復元）、**honesty**（矛盾する要求で「ユーザーに伝える」以外に正解が無いタスク）、コスト・トークン・時間、churn（変更行数）、**skill 発火率**（transcript / hook イベントから判定）
- **シナリオ設計**: 組み込み 13 タスク（3 バグ報告されたが実は 3 つ目がある、6 根本原因の集計ずれ、矛盾テスト等）+ skill を読んで自動生成するタスク。生成パイプラインが重要: ①skill の約束を抽出 → ②**skill 本文を見せずに**タスク生成（手順コピーを報酬化しない）→ ③fixture が hidden suite で落ち、参照解で通ることを検証 → ④独立モデルが「慎重なエンジニアが予見できないテスト」を却下（fairness review）→ ⑤**素の agent で 2 回走らせ、常に解ける/常に解けないタスクを難化・修理・除外（calibration）**
- **隔離**: 試行ごとに使い捨て workspace + 空の agent 設定ディレクトリ（個人 CLAUDE.md / plugin / hook を排除）。skill 以外のものが読まれた・skill が読まれなかった試行は infra error として破棄。条件は**タスク内でインターリーブ**（レート制限・時間帯ドリフトを均等化）。skill の commit SHA・agent version・model を記録
- **CI**: `--json` / `--fail-on-regression`（測定可能に害したら exit 1）、GitHub Actions の benchmark workflow（`CLAUDE_CODE_OAUTH_TOKEN`、週次実行）
- **実測結果（同 repo docs/results/2026-10-claude-code-sonnet-5-5.md）**: Sonnet 5.5、6 タスク × 3 試行 × 8 条件 = 144 試行。superpowers / karpathy / mattpocock / agent-skills / ponytail / ECC **すべて pass rate +0pt**（baseline が 100%）。コストは +0%〜+186%（ECC）。**大半の skill は 18 試行で一度も発火せず**、superpowers は 22%。著者自身「この suite は well-specified な小タスクしか無く、長期・曖昧な仕事は測れていない」と明記
- **限界（README 自己申告）**: タスクは小さい単一 Node.js repo、コンテナ sandbox 無し（permission bypass で temp dir 実行）、★1 で成熟度は低い
- **取り込めるもの**: false-done / 改竄 / honesty の 3 指標、生成タスクの fairness review + calibration、インターリーブ、infra error の破棄規約

### 1-2. edonadei/caliper — 発火（activation）と効果を分離して採点
- URL: https://github.com/edonadei/caliper （★227 / push 2026-10-27 / MIT）、PyPI `caliper-eval`
- 実際に agent が読む場所へ skill を install（prompt に貼らない）。**Activation scoreboard**（agent が skill を「選んだか」を効果と別に採点）、**Neighbourhoods**（競合 skill を宣言し、どの prompt でどちらが勝つべきかを assert）、`--ablate` で skill 抜き再実行。**「single-run 成功率を先に出す。pass@k は不安定な skill を甘く見せる」**という方針。Claude Code / Codex / Pi / Hermes 対応。採点は LLM judge + Python assert（skillarena README の比較表より）
- 取り込めるもの: 発火率と効果の分離、skill 間の衝突テスト、pass@k を主指標にしない姿勢

### 1-3. adewale/skill-eval-harness — 統計・衛生面が最も厚い
- URL: https://github.com/adewale/skill-eval-harness （★79 / push 2026-10-09 / MIT）、PyPI `skill-eval-harness`
- `(case, model, repetition)` 単位で with_skill / without_skill / old_skill / `ablation:<id>` を**厳密にペア化**し、ペアが揃わなければ理由付きでブロック。sign-flip 検定 → 95% 区間（**6 ペア未満は下限なし**と明示）、`noise_check`（ノイズ床が headroom や `--min-lift` を超えていないか）、pass@k と **pass^k**（k 回全成功）を併記
- `tune` / `holdout` / `holdback` の split 規律、**leakage lint**（prompt に答えが漏れていないか）、canary による contamination 検査、`case_flags`（saturated = 両条件常に成功 / floor = 両条件常に失敗 / no-lift / flaky）
- 採点パスに**モデル呼び出しなし**（決定的 assertion: string/regex/file/JSON/script oracle）。judge は別系統で `compare-judges` / `judge-robustness` / `judge-alignment`
- ablation で「どの指示・チェックリスト・参照・スクリプトが load-bearing か」を `expected_regressions` 宣言付きで検証。`trajectory_diff`（片方の arm だけが打ったコマンド、ツール呼び出し数差）。`report --format junit|github` で CI gate 化
- 取り込めるもの: ペア化とブロック理由、saturated/floor フラグ、leakage lint、ablation で load-bearing 要素を特定する発想（役割定義の各条項に適用できる）

### 1-4. aleclindz/seo-skill-bench — planted-defect answer key + 事前登録 rubric
- URL: https://github.com/aleclindz/seo-skill-bench （★48 / push 2026-10-19 / MIT）
- `claude -p` で実 install した skill を、**欠陥を仕込んだ fixture サイト**（10 true positive + 5 trap + 3 判断問題）に対して実行。採点は決定的 matcher（検出 recall 40%、**trap 回避 25% = 既に正しいものを「直せ」と言ったら幻覚として減点**）、匿名化した blind LLM judge panel（25%）、実行完了（10%）
- **rubric を実行前に凍結し版管理**（rubric 版が違う結果は比較不可）、prompt でヒントを与えない（全 entrant 同一の最小 prompt）、N=3 の中央値 + ばらつき報告、「fleet 間ばらつき ±8 以内は同率扱い」と README に明記。メンテナ自身の skill が最下位だった履歴（adjudication history）を公開
- **context footprint を品質と別軸で公開**（resident tokens = 全 skill の name+description、activation tokens、bundle tokens → light/medium/heavy）
- vanilla baseline が 4 位 → 「vanilla に勝てない skill は負の価値」
- 取り込めるもの: trap（やってはいけない修正）を決定的に採点する設計 = **reviewer の過剰指摘テストにそのまま転用可能**、rubric 事前登録、同率帯の明示、footprint 別軸

### 1-5. garrytan/gstack — 「役割ベースのハーネス配布」+「有料 eval tier の CI 運用」を両立している実例
- URL: https://github.com/garrytan/gstack （★138,350 / push 2026-10-31 / MIT）
- ハーネス側: `plan-ceo-review` / `plan-eng-review` / `plan-design-review` / `review` / `qa` / `ship` / `cso` 等、役割ごとの skill 群（ルート一覧で確認）
- eval 側（CONTRIBUTING.md「Testing & evals」、docs/TESTING_INTERNALS.md）:
  - Tier 1 static（無料）/ Tier 2 E2E（`claude -p`・PTY・Agent SDK で skill を実行、有料）/ Tier 3 LLM judge
  - **diff から touchfile で有料ケースを選択**（`eval:select`）。新しい prompt にカバレッジ登録が無いと計画段階で fail
  - ケース種別を事前固定: `rule`（1 試行・1 回でも失敗なら fail。「plan mode で書き込まない」「決定前に質問する」等の**契約**用）/ `behavior`（独立 3 試行、2/3 以上 + 契約違反なしで PASS、`PASS 2/3` と失敗理由を必ず表示）/ `judge`（固定入力に 3 サンプル、次元ごとに中央値で gate）
  - timeout・crash・infra 失敗は失敗試行として数える。**retry しない**（gate のみ同一 HEAD で 1 回だけ flaky rerun）
  - ship bar: 単一ケースを 10 試行（behavior は 12）で MEETS 9/10。$2/試行超で確認、$25/ケースで停止
  - 週次 flake sweep（予算上限 $150/7日）、Wilson 区間付き pass-rate 履歴、quarantine、census が赤になった時の手順書（無料の回帰テストで直してから有料 run を 1 回だけ）
  - 「report-only 評価は書き込み可能ツールを残したうえで、禁止書き込み（後で元に戻した編集を含む）を独立に検出せよ。最終 diff がきれいでも不十分」「観測器は意図的に悪い control で先に検証せよ」
  - capture model と judge model を別々に pin（judge は被評価モデル変更に追随しない）
- 注意: 定量評価は**自分の skill の回帰検知**用であり、「役割分離そのものの効果（vanilla 比）」を公表しているわけではない。規模が大きくそのまま流用は重い
- 取り込めるもの: rule/behavior/judge の 3 分類と試行数の事前固定、diff 選択、予算上限、flaky rerun 規約、「書き込み禁止」系契約の観測方法

### 1-6. obra/superpowers — 「skill の TDD」= 圧力シナリオ
- URL: https://github.com/obra/superpowers （★309,511 / push 2026-10-29 / MIT）
- `skills/writing-skills/testing-skills-with-subagents.md`: skill 無しで圧力シナリオを走らせ失敗と**言い訳（rationalization）を逐語記録** → skill を書く → 再実行で遵守を確認 → 抜け穴を塞ぐ。シナリオは時間圧・権威・サンクコスト・疲労を重ね、A/B/C の選択を迫る形式（https://github.com/obra/superpowers/blob/main/skills/writing-skills/testing-skills-with-subagents.md）
- `tests/claude-code/`: `claude -p` を叩き `assert_contains / assert_not_contains / assert_count / assert_order` で検証する bash スイート（fast / integration 10–30 分）。`analyze-token-usage.py` あり
- 定量性: 試行数・統計は無く、合否 assertion のみ。ただし「役割/規律を守らせる skill」を**誘惑に晒して**試すという設計思想は本計画（maker≠approver、推測せず escalate）に直結
- 経緯: https://blog.fsck.com/2025/10/09/superpowers

### 1-7. langchain-ai/skills-benchmarks + LangChain ブログ
- URL: https://github.com/langchain-ai/skills-benchmarks （★119 / push 2026-09-21 / MIT）、https://www.langchain.com/blog/evaluating-skills
- Docker sandbox で Claude Code を実行。**task と treatment（CONTROL / ALL_MAIN_SKILLS / 分割 vs 統合 skill / 簡潔版）を分離**し任意に掛け合わせる。`skills/noise/` に**妨害用 skill**を置き干渉を測る。pytest `--count=3` で反復。trajectory を LangSmith に送り、Claude Code 自身に trace を要約させて改善ループを回した
- 取り込めるもの: task×treatment の直交設計、distractor skill による干渉テスト

### 1-8. Chachamaru127/claude-code-harness — 日本語圏のハーネス配布 + 探索的ベンチ
- URL: https://github.com/Chachamaru127/claude-code-harness （★3,191 / push 2026-10-26 / MIT）
- Plan→Work→Review の役割ハーネスを配布。`benchmarks/breezing-bench/agent-eval/REPORT.md`（2026-02-07）: 「新機能 + 隠しバグ」タスク 3 個 × 5 runs × 2 条件、CLAUDE.md に「`npm run validate` を走らせて直せ」の 2 行だけ足した ablation で 93.3% vs 20.0%（Fisher p<0.001）。ただしモデルは GLM-4.5-air、タスク 3 個のうち 2 個が同一バグ型、calibration 後に試行数を増やした適応的設計（optional stopping）と**報告書自身が限界を開示**。フルパイプライン（Agent Teams・reviewer・retake loop）の効果は測っていない
- 基盤に `@vercel/agent-eval` を使用
- 取り込めるもの: 限界の自己開示の書式（exploratory / not pre-registered）、隠しバグを仕込む fixture パターン

### 1-9. vercel-labs/agent-eval（`@vercel/agent-eval`）
- URL: https://github.com/vercel-labs/agent-eval （★275 / push 2026-10-20 / GitHub 上 license 表記なし、npm は MIT v2.6.0）
- experiments/*.ts で条件を宣言、Docker sandbox、`--dry`（無課金プレビュー）、`--smoke`、fingerprint 一致で結果再利用。Vercel 自身の「AGENTS.md vs skills」評価の基盤（後述 §2）

### 1-10. 小規模・CI 系
- **skill-bench/skill-eval-action**（https://github.com/skill-bench/skill-eval-action ★11 / push 2026-06-22 / MIT）: YAML テストケース + 自動採点 + PR コメント。`evals/` を持つ skill を自動発見して matrix、`pass-threshold`。統計なし。Marketplace: https://github.com/marketplace/actions/skill-eval
- **mslavov/claude-code-eval**（https://github.com/mslavov/claude-code-eval ★3 / push 2025-09-03 / license なし）: promptfoo で slash command・subagent を評価するラッパ。放置気味
- **quantumsheep/simple-french**（https://github.com/quantumsheep/simple-french ★3 / push 2026-08-19 / MIT）: 文体 skill を 112 生成で評価。決定的 regex linter + **両順序の blind pairwise judge**（45/56 勝）。ログイン済み CLI だけで再現、resumable runner。「Pi 未実行なので表を載せない（古い表より無い方がよい）」
- **[未検証]** Reddit 紹介の "SkillBenchmark"（YAML タスク + judge、N 回 with/without、信頼区間とトークン差）: https://www.reddit.com/r/ClaudeWorkflows/comments/1toj62w/ — repo 本体は未確認

---

## 2. 役割ベース / マルチエージェント SDLC 構成の定量評価

| 対象 | 定量評価の有無 | 出典 |
|---|---|---|
| Superpowers vs vanilla | **skillarena**: 小タスクで +0pt、+27% コスト、発火 22%（144 試行、§1-1） | https://github.com/caioagiani/skillarena/blob/main/docs/results/2026-10-claude-code-sonnet-5-5.md |
| Superpowers / GSD / vanilla | **n=1 の逸話**: 同一サイト構築で vanilla 20 分・200k tok、Superpowers 60 分・250k、GSD 105 分・1.2M。見た目は同等、1 回目で動いたのは Superpowers のみ **[未検証・単発]** | https://www.linkedin.com/posts/chasehannegan_i-tested-gsd-superpowers-and-vanilla-claude-activity-7458546307163443200-N-0F |
| Superpowers vs plan mode | YouTube の同一 Shopify アプリ 2 回構築、stock は約 1/3 の時間で同等 **[未検証・単発]** | https://www.youtube.com/watch?v=98e8lpOtaWc |
| Superpowers / GSD / gstack | 「TDD 強制で回帰バグが目に見えて減った」等、**数値なしの体験談** | https://medium.com/@tentenco/superpowers-gsd-and-gstack-what-each-claude-code-framework-actually-constrains-12a1560960ad |
| BMAD | 定量比較は見つからず。計画フェーズ約 3 時間、一巡 $200 という**二次情報**のみ **[未検証]** | https://re-cinq.com/blog/multi-agent-orchestration-bmad-claude-flow-gastown / https://rywalker.com/research/bmad-method |
| BMAD / Spec-Kit / OpenSpec | 5 段階の主観スコア表（実測なし） | https://ranthebuilder.cloud/blog/i-tested-three-spec-driven-ai-tools-here-s-my-honest-take |
| claude-flow (ruflo) / CCPM | 公開された定量比較は**見つからず** | https://github.com/ruvnet/ruflo（★80,322 / MIT）https://github.com/automazeio/ccpm（★8,424 / MIT） |
| 7 種 skill / CLAUDE.md 一括 | skillarena（上記）| — |
| AGENTS.md / CLAUDE.md（学術） | ETH/DeepMind AGENTbench（138 タスク）: LLM 生成 context は成功率を下げコスト +20% 超、開発者記述でも小幅 | https://academy.dair.ai/blog/agents-md-evaluation |
| 同上 | 288 評価 run（Claude Code / Codex、17 タスク×3 戦略×3 反復）: 差なし（Claude 53.3/55.6/55.6%）、TOST で 10–15pt 以内。**MDE ≈ 30pt、10pt を検出するには 120–200 タスク必要**と著者が明記 | https://ar5iv.labs.arxiv.org/html/2607.27250 / https://codex.danielvaughan.com/2026/08/06/do-context-files-help-coding-agents-agents-md-ablation-study-codex-cli-correctness-vs-efficiency |
| 同上 | 124 PR で AGENTS.md あり: 実行時間中央値 −28.64%、出力トークン −16.58%、完了率同等 | https://arxiv.org/html/2601.20404v2 |
| Vercel: AGENTS.md vs skills | 8KB の docs index を AGENTS.md に埋めると 100%、skill は最大 79%（明示指示ありでも）、指示なしでは無と同等。skill の発火 44% | https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals |
| マルチエージェント一般 | 「SWE-bench 72% vs 48%」「81% vs 52% 定着率」等の数字が流通しているが**一次ソース未確認の二次ブログ** **[未検証]** | https://udit.co/blog/anthropic-agentic-coding-trends-report-multi-agent-dev |
| フレームワーク分類 | "From Prompt to Process"（Macedo, 2026-06）のプロセス分類・比較評価 **[未検証・本文未読]** | https://www.emergentmind.com/topics/bmad-method |

**結論**: 役割分離 SDLC 構成（BMAD / claude-flow / CCPM / 役割 session 分離）を**vanilla と統制比較し統計付きで公表した事例は見つからなかった**。存在する定量は (a) skillarena の小タスク null 結果、(b) context file の学術 ablation（null〜小）、(c) n=1 の体験談のみ。

---

## 3. シナリオ型の行動テスト（シード済みバグ / 矛盾仕様 / escalate すべき場面 / reviewer の過剰指摘）

### 3-1. 推測せず質問・escalate すべきかを測るもの
- **ClarifyCodeBench**（https://github.com/fangz-cs/ClarifyCodeBench ★2 / push 2026-07-20 / MIT、arXiv:2607.00711）: LiveCodeBench から情報を**削除のみ**で 419 タスク作成（人手注釈、LLM 不使用）。各タスクに key clarification question + 正解回答 + 曖昧さの型 + hidden test。指標 TKQR（重要質問を早く聞けたか）と ORA（質問回数が必要数に近いか = 聞きすぎも減点）
- **Ask or Assume?**（arXiv:2603.26233）: SWE-bench Verified の underspecified 版。検出と実行を分けた multi-agent scaffold で 69.40% 解決 https://arxiv.org/html/2603.26233v3
- **ClarEval**（arXiv:2603.00187）**[未検証・二次要約経由]**: 曖昧タスクで推測すると 90% 超失敗、明確化能力と coding 能力の相関 r=0.32 https://codex.danielvaughan.com/2026/06/19/clareval-ask-or-assume-coding-agent-clarification-codex-cli-plan-mode-agents-md
- **AskBench**（https://github.com/jialeuuz/askbench ★8 / push 2026-02-14 / MIT）: judge が「模擬ユーザー」と「採点者」を兼ねる対話型
- **skillarena の `slugify-conflict`**: 互いに矛盾する 2 テスト。正解は「ユーザーに伝える」のみ、green は gaming 扱い。OpenCode + 小型モデルの baseline は実際に特殊ケース化して "6/6 passing" と報告した（同 results doc）
- **gstack の `rule` 型契約**: 「決定の前に質問する」「plan mode で書き込まない」を 1 試行・1 失敗で fail（§1-5）

### 3-2. シード済み欠陥 / 罠
- seo-skill-bench の planted defects + traps（§1-4）、Chachamaru の「新機能 + 隠しバグ」（§1-8）、skillarena の「報告されていない 3 つ目のバグ」（§1-1）

### 3-3. reviewer の過剰指摘 / 見逃し（precision と recall の両方）
- **withmartian/code-review-benchmark**（https://github.com/withmartian/code-review-benchmark ★299 / push 2026-09-15 / MIT）: offline（golden comments 固定）と online（実 PR で bot 指摘 → 開発者が実際に直したかを LLM で照合）の 2 本立て。方法論文書が**judge 依存性・汚染・文脈欠落・「バグの定義がユーザーで違う」**を明記し、ユーザー自身の AGENTS.md/CLAUDE.md 等を採点仕様として grader にも渡す https://github.com/withmartian/code-review-benchmark/blob/main/methodology/full.md
- **GitHub ReviewBench**: severity 別評価、Fβ で recall/precision の重みを可変、offline 予測と online A/B の一致を検証 https://github.blog/ai-and-ml/github-copilot/reviewbench-an-open-benchmark-for-ai-code-review
- **MacroscopeBench**（vendor）: **欠陥の無い control commit を混ぜて precision を測る**、1 run あたり 1 バグ 1 回まで、3 回独立実行、signal-to-noise 比（最上位 6.26:1、下位 ≈1.1:1）https://macroscope.com/content/ai-code-review-benchmark-best-models
- Augment の golden comments 比較表では Claude Code を reviewer にした場合 precision 23% / recall 51%（vendor 自社ベンチ、**[未検証]**）https://www.augmentcode.com/blog/introducing-augment-code-review
- 自己評価バイアス: 同一モデルは自分の生成物を高く評価する（Panickssery et al., NeurIPS 2024）https://proceedings.neurips.cc/paper_files/paper/2024/file/7f1f0218e45f5414c79c0679633e47bc-Paper-Conference.pdf — maker≠approver を同一モデル別 session で実装する場合の弱点
- 「構造的に別の reviewer でも、同じモデル・同じ不完全仕様・同じ欠落証拠を共有しうる。handoff は commit SHA に束縛し、作成者の理由付けではなく元要件・成果物・証拠を渡せ」https://github.com/FlorianBruniaux/claude-code-ultimate-guide/blob/main/guide/core/agent-harness.md （★6,300 / CC-BY-SA-4.0）

**データセットとして使えるもの**: ClarifyCodeBench（MIT）、AskBench（MIT）、Martian offline set（MIT）。**SDLC 役割分離（PO↔Dev↔QM の handoff、設計書衝突の調停、approve 権限の越権）を対象にしたデータセットは見つからなかった**。

---

## 4. 実務ノウハウ（落とし穴・試行数・報告方法）

### 落とし穴
1. **天井効果**: 現行フロンティアモデルは小さく明確なタスクをほぼ全部解く → pass rate で差が出ない（skillarena 144 試行で全条件 100%）。対策は calibration（素の agent が常に解けるタスクを難化・除外）と、pass rate 以外の指標（false-done・改竄・honesty・発火率・コスト）
2. **発火しない skill**: 効果ゼロの最大要因。skillarena で多くの plugin が 0/18、Vercel で 44%。発火率を効果と別に測る（Caliper、skill-eval-harness `skill-trigger-matrix`）
3. **常駐コスト**: description は毎メッセージに常駐。footprint を別軸で公開（seo-skill-bench）、ECC は +186%
4. **非決定性**: seo-skill-bench は fleet 間 ±8 点を同率帯と明示。gstack は retry 禁止（例外 1 回の flaky rerun）+ 2/3 規則
5. **サンプル数不足**: 17 タスク×3 反復で MDE ≈ 30pt、10pt 検出には 120–200 タスク（288-run 論文）。skill-eval-harness は 6 ペア未満で区間の下限を出さない
6. **judge バイアス**: 位置・冗長・自己選好。対策は両順序比較（simple-french）、匿名化 + 事前 anchor（seo-skill-bench）、judge を別モデルで pin（gstack）、judge と人手ラベルの一致検証（skill-eval-harness `judge-alignment`）。Martian は judge によりスコアが変わり、多くのベンチが judge のばらつきを報告していないと指摘
7. **汚染・リーク**: prompt に答えが漏れる、fixture の物語を agent に読ませる（seo-skill-bench は「manifest を session に読ませるな」）、skill 本文を見たモデルがタスクを作る（skillarena は skill 本文を見せずに生成）
8. **環境汚染**: 個人の CLAUDE.md / plugin / hook が混入。試行ごとに空の設定ディレクトリ、意図しないものが load されたら破棄（skillarena）
9. **観測器の誤り**: 「最終 diff がきれい」は禁止書き込みが無かった証拠にならない（元に戻した編集）。観測器は悪い control で先に検証（gstack）
10. **適応的設計 / optional stopping**: 差が見えてから試行数を増やすと偏る（Chachamaru の自己開示）。rubric と試行数は事前に固定（seo-skill-bench、gstack）
11. **sandbox**: permission bypass で temp dir 実行は危険。CI / VM / Docker（skillarena は Docker 未対応を自認、LangChain・vercel agent-eval は Docker）

### 推奨試行数（コミュニティの実例）
- 3 試行が事実上の標準（skillarena 既定、seo-skill-bench、gstack behavior/judge、LangChain `--count=3`、288-run 論文）
- 確定判断には 10 試行で 9/10（gstack ship bar）。契約型（必ず守るべき規則）は 1 試行で 1 失敗 = fail
- 効果量の検出力はタスク数で決まる: 10pt 差を言うなら 100 タスク超が必要（288-run 論文）
- 主指標は single-run 成功率、pass@k は甘い（Caliper）。pass^k を併記（skill-eval-harness）

### 報告方法
- 条件 × 指標の表 + Δ と 95% CI + 「0 を跨ぐなら効果なし」の文言（skillarena）
- LEADERBOARD.md + 同率帯の明示 + adjudication history（seo-skill-bench）
- `results/<run-id>/` に index.html・report.md・results.jsonl・全 transcript（skillarena）
- 静的 HTML review page（skill-eval-harness `render-viewer`）、JUnit / GitHub 形式
- GitHub Actions job summary + artifact、週次 tracking issue、Wilson 区間付き pass-rate 履歴（gstack）
- 限界の自己開示節（Chachamaru、skillarena "Current limitations"）、commit SHA / agent version / model の記録

---

## 5. (a) ハーネス配布と (b) 組み込み定量評価を兼ねる既存プロジェクトはあるか

**部分的にはある。計画どおりの組み合わせは見つからなかった。**

| プロジェクト | (a) 役割分離ハーネスの配布 | (b) 組み込みの定量評価 | 計画との差 |
|---|---|---|---|
| garrytan/gstack | ○ 役割 skill（CEO/eng/design review・QA・ship・CSO）。ただし**単一 session 内で切り替える skill 群**であり、別 session・label mailbox・maker≠approver の権限分離ではない | ◎ 有料 eval tier・試行数規約・diff 選択・予算上限・flake sweep | 評価は**自 skill の回帰検知**。vanilla との比較や、役割分離そのものの効果は公表していない |
| Chachamaru127/claude-code-harness | ○ Plan→Work→Review、別 reviewer、spec.md / Plans.md | △ 探索的ベンチ 1 本（30 run、GLM、要素 ablation のみ） | CI 回帰 gate なし、フルパイプラインは未測定 |
| obra/superpowers | ○ 方法論 skill 群 | △ `claude -p` + assertion、圧力シナリオ（統計なし） | 試行数・CI gate・vanilla 比較なし |
| skillarena / Caliper / skill-eval-harness | ×（評価専用） | ◎ | 任意のハーネスを外から測る道具。組み合わせの素材になる |
| anudeeps28 / MartinKChen / jadedagher の claude-code-harness 群 | ○ GitHub issue + label を durable state にした pipeline（https://martinkchen.github.io/harness-claude-code/workflow.html）| × eval 用 path なし（anudeeps28 は evaluator agent のみ） | ★0〜10、定量評価なし |
| VKirill/claude-lane-stack | ○ 1 人用マルチエージェント工場（PM + 複数 writer、auto-merge）| △ eval-planner / eval-auditor agent はあるが計測結果は未確認 | ★125 |

**調べた範囲**: GitHub リポジトリ検索 / Tavily・Web 検索で "skill eval", "skills benchmark", "claude code eval", "agent skills evaluation", "CLAUDE.md benchmark", "agents.md evaluation", "harness eval", "claude -p eval", "skill regression test", "Superpowers vs vanilla", "BMAD claude-flow CCPM benchmark", "clarifying question benchmark coding agent", "code review benchmark false positive", "GitHub labels handoff roles harness"。対象リポジトリは `gh api` で README・ディレクトリ・code search（`eval in:path`）を確認。**未確認**: Discord / X スレッドの中身、BMAD・claude-flow リポジトリ内部の test 実装、非英語圏（中国語）のブログ。

**「役割を別 session に分け、GitHub label で受け渡し、作成者≠承認者を強制し、SSOT の優先順位と設計書衝突の調停規則を持ち、レビュー前の文脈読み込みを義務化したハーネス」を配布し、かつその各規則の効果を vanilla・旧版と比較して CI で回帰検知する公開プロジェクトは見つからなかった。**

---

## 取り込むべきノウハウ Top 10

1. **評価器を先に検証する**: fixture が hidden test で落ち、参照解で通ることを機械検証（skillarena `validate --audit`、seo-skill-bench `validate-fixture` / `score --self-test`）。観測器は意図的な悪い control で検証（gstack）
2. **素の agent で calibration**: 常に解ける・常に解けないシナリオは効果を測れないので難化か除外（skillarena）。saturated / floor フラグを結果に出す（skill-eval-harness）
3. **pass rate 以外の行動指標**: false "done"、テスト改竄、矛盾仕様での honesty、発火率、trap（正しいものを壊す提案）、コスト・常駐トークン。役割ハーネスで見たいもの（越権 approve、推測実装、必読文書の未読）はすべてこの型で決定的に書ける
4. **ケース種別ごとに試行数と合格規則を事前固定**: 契約型 = 1 試行 1 失敗で fail / 行動型 = 3 試行 2/3 + 契約違反ゼロ / judge 型 = 3 サンプル中央値。retry しない（例外 1 回）、infra 失敗も失敗に数える（gstack）
5. **厳密なペア化と区間推定**: (シナリオ, モデル, 反復) 単位で with/without/旧版をペアにし、paired bootstrap か sign-flip で CI。CI が 0 を跨ぐなら「効果なし」と書く（skillarena、skill-eval-harness）
6. **rubric と judge の事前登録・版管理**: rubric 版が違う結果は比較しない。judge は被評価モデルと別系統で pin、匿名化、両順序比較（seo-skill-bench、gstack、simple-french）
7. **完全な隔離と破棄規約**: 試行ごとに使い捨て workspace + 空の設定ディレクトリ。意図しない設定が load された / 対象が load されなかった試行は infra error として破棄。条件はインターリーブ実行（skillarena）
8. **リーク防止**: シナリオ生成者に skill 本文を見せない、answer key を session に入れない、leakage lint と canary（skillarena、seo-skill-bench、skill-eval-harness）
9. **コスト統制を CI 設計に組み込む**: diff から影響するシナリオだけ選ぶ、`--dry` で無課金プレビュー、試行・ケース・週あたり予算上限、fingerprint で結果再利用、重い通しシナリオは非 blocking の週次レーン（gstack、vercel agent-eval）
10. **ablation で load-bearing な規則を特定し、限界を自己開示する**: 役割定義の各条項を 1 つずつ抜いた arm を作り、`expected_regressions` を宣言して検証（skill-eval-harness）。結果には exploratory / not pre-registered、タスク数、MDE を明記（Chachamaru、288-run 論文）

## 差別化の余地

1. **役割分離そのものの効果測定は空白**: BMAD / claude-flow / CCPM / Superpowers を含め、「別 session + maker≠approver + label mailbox」を vanilla と統計付きで比較した公開事例は無い。既存の定量は単一 session の skill か context file に限られる
2. **SDLC 規律の行動シナリオ集が存在しない**: 既存データセットは関数単位の曖昧要件（ClarifyCodeBench）か PR レビュー（Martian）。「設計書 A と B が矛盾するとき SSOT 優先順位に従うか」「承認権限の無い role が approve しようとするか」「必読文書を読まずにレビューするか」「仕様不明時に推測せず escalate するか」「reviewer が範囲外の指摘を濫発するか」を fixture repo + 決定的 check で測るスイートは新規性が高い
3. **マルチ session・非同期 handoff の評価ハーネス**: 既存ツールはすべて単一 `claude -p` 実行が単位。複数 role session を label（mailbox）で連鎖させ、handoff ごとの取りこぼしを測る仕組みは見当たらない
4. **ハーネス版間の回帰 gate を配布物に同梱**: gstack は自 skill の回帰検知のみ、skillarena は外部から測る道具。「ハーネスを配布し、利用者が自分のフォークや規則改訂を同じスイートで回帰検知できる」形は未踏
5. **null 結果を出せる設計**: 既存結果の多くは null（skillarena、288-run 論文）か n=1 の逸話。MDE を事前計算し、効く/効かない/判定不能を正直に出す報告様式自体が差別化になる。とくに「長く曖昧な仕事」で効くという主張は skillarena 著者自身が未検証と認めている領域
6. **同一モデルの maker≠approver の弱点を定量化**: 自己選好バイアスは知られているが、role session 分離でどこまで緩和するか（別モデル reviewer・SHA 束縛 handoff・証拠のみ渡す方式との比較）を測った例は無い
7. **日本語圏**: 日本語の役割ハーネス（Chachamaru）は探索的ベンチ止まり。規則・文書が日本語のハーネスを日本語シナリオで評価する公開事例はほぼ無い
