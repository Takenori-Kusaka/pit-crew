# 市場調査: エージェントのスキルのマーケットプレイスと「役割分離マルチセッション開発ハーネス」の配布先・競合

調査日: 2026-10-31。数値は調査時点の一次情報（各サイト・GitHub API）。**[未検証]** は一次情報で裏が取れなかったもの。GitHub star 数は `gh api repos/<owner>/<repo>` で 2026-10-31 に取得した値。

---

## 1. エージェントのスキルのマーケットプレイスの実在性と規約

### 1.1 運営者
- 運営会社はオランダ法人。準拠法はオランダ法、管轄はアムステルダムの裁判所。規約に番地の記載は無く「Location: Netherlands」のみ。 — （URL 省略）
- 創業者・CEO は個人名のため省略。2026 年創業、アムステルダム拠点。 — （出典 URL 省略）
- 2026-07-09 のプレスリリースでは「ローンチ 3 ヶ月でスキル 2,000 件・登録ユーザー 3,000 人・月間訪問 50,000」と発表し、Antler の出資を受けているとしている。ただしこれは **Newsfile 経由の有料配信リリース（出典: Plentisoft）で、数値はすべて自己申告**。 — （URL 省略）
- 営業メールにあった「月間訪問 65k+、大半がオーガニック」を第三者データで確かめる手段は見つからなかった（Similarweb の公開データは検索で出てこない）。**[未検証]**
- 自社の数値が文書ごとに食い違っている。/sell は「16,000+ skills / 15,000+ users / 2,2000+ Creators（誤植）」、Codex 向けページは「13,000+ Skills」と書いているが、/skills の閲覧ページに出ている件数は **600**。前者は GitHub からの索引分を含む数字かもしれない **[未検証]**。 — （URL 省略） / （URL 省略） / （URL 省略）
- LinkedIn に「Anthropic がエージェントのスキルのマーケットプレイスを Claude の connector (MCP) directory に追加した」という再投稿がある。**[未検証]**（Anthropic 側の掲載ページは確認していない）

**判定**: 実在するオランダ法人で、規約も整っている。スキャムの兆候は見当たらない。ただし創業は 2026 年でまだ半年ほどで、規模を示す数値は自己申告しかなく、文書間で矛盾もある。

### 1.2 出品者向け規約（（URL 省略） , （URL 省略））
| 項目 | 内容 |
|---|---|
| 収益配分 | 出品者 70% / エージェントのスキルのマーケットプレイス 30%（決済手数料込み）。出品料なし |
| 権利 | 出品者が所有権を保持し、エージェントのスキルのマーケットプレイスには **非独占**・全世界の表示・配信ライセンスを許諾（§8.1）。他チャネルとの併売は可能 |
| 購入者のライセンス | 永続・個人用・譲渡不可。**コピー・保存・エクスポート・再配布は禁止**（§8.2）。ファイルのダウンロードは提供されない（§5.2） |
| 配信方式 | 購入者のエージェントが **エージェントのスキルのマーケットプレイスの MCP 経由で使うたびに読み込む**（`get_skill`）。ディスクには保存させない — （URL 省略） |
| 返金 | 掲載ページの説明どおりに動かなければ全額返金。購入から 30 日以内（§5.5） |
| 支払い | Stripe Connect（銀行振込）では残高が $3.50 に達した時点で支払い。Zoneless 経由の USDC (Solana) なら取引確定から 72 時間後。KYC が必須 |
| 税 | エージェントのスキルのマーケットプレイスが **Merchant of Record** として購入者側の VAT・売上税を徴収・納付する。出品者自身の所得税・法人税は出品者の責任。自己請求（self-billing）方式で、30 日前の通知で解除できる（§7.5） |
| 削除・停止 | エージェントのスキルのマーケットプレイスは裁量で出品の却下・削除・停止ができ、規約違反なら予告なしにアカウントを停止できる（§6.2, §12）。外部販売へ誘導するリンクは無通知で削除される（§6.3a）。出品者はエージェント配信やクレジット制度の対象から外れることを選べない（§6.5） |
| 審査 | 自動の 8 項目セキュリティスキャン、AI による安全性・意図のレビュー、人手の確認。通常 24〜48 時間。無料スキルの再パッケージは却下される |
| 形式 | SKILL.md に任意の scripts / templates / reference を添えた ZIP。複数ファイル可。価格は買い切りか月額サブスク |
| アフィリエイト | 紹介した購入者の支払いの 20% を 6 ヶ月間受け取れる |

**日本在住の出品者の税務**: 規約に W-8BEN や日本への言及は無い。エージェントのスキルのマーケットプレイスはオランダ法人なので米国の源泉徴収の枠組みは原則として関係ないと考えられる。日本側ではエージェントのスキルのマーケットプレイスの運営会社への役務提供の所得を申告することになり、消費税は輸出免税（国外事業者向けの役務提供）に当たる可能性がある。いずれも **[未検証・税理士確認推奨]**。Stripe Connect の日本対応も、本調査では裏を取っていない **[未検証]**。

### 1.3 ハーネスとの適合性（重要）
エージェントのスキルのマーケットプレイスは「スキルを使うたびに MCP で本文を読み込み、**ディスクに保存させない**」方式を取っている。このため、ファイルとして repo に置かれて初めて機能する構成物は配信できない:
- `.claude/agents/*.md`（ロールごとのセッション定義・subagent）
- `.claude/settings.json` の hooks（PreToolUse による gate 等）
- worktree・クローン分離の手順や scripts、`npm run pre-ready` のようなリポジトリに組み込む検査
- GitHub labels の初期設定、PR テンプレート、ブランチ ruleset

/sell の説明では添付の scripts も「エージェント内で実行」され、ダウンロードはされない。hooks・plugin・subagent の扱いについては記載が見つからなかった **[未検証]**。**役割分離ハーネスの本体は「repo に配置する設定一式」であり、エージェントのスキルのマーケットプレイスの配信モデルとは構造的に噛み合わない。** 載せられるのは「導入手順を案内する入口スキル」か、単体で成立する部品（例: adversarial reviewer、pre-ready チェックの考え方）に限られる。

---

## 2. エージェントのスキルのマーケットプレイスのカタログ

- 4 群 30 カテゴリ、閲覧ページの表示は 600 件。カテゴリ別件数は Agents & Orchestration 71 / Writing & Content 43 / Marketing & SEO 39 / Frontend 36 / Business & Ops 30 / Testing & Debugging 29 / Code Quality & Review 25 / Trading 24 / Productivity 21 / Workflow Automation 19 / Security 18 など。 — （URL 省略）
- **価格帯**: 無料が多数を占める。有料はおおむね $2.99〜$19.99 で、まれに $50 のものや月額 $14.99 のものがある。今月のスキルは「GEO SEO Suite」（$9.99）。 — 同上
- **利用量の目安**（ラベルの無い数値を利用数と解釈した値）: 人気上位は無料スキルで、humanize writing 約 6,974、code reviewer 1,840（4.4 点 / レビュー 16 件）。**有料スキルの数値は 1 桁〜2 桁**（Agent Work Order Writer $5: 2、Coding Agent Quality Gate $14: 13、AI Coding Prompt Refiner $19.99: 12）。 — （URL 省略） / （URL 省略）
- **開発プロセス系の既存出品**:
  - Agents & Orchestration（71 件）: Agent Work Order Writer（$5、受入基準つきの作業指示 + 報告の照合）、Cowork: Multi Agent Task Inbox over MCP（$6）、agentic workflow（$5）、Checkpointed Execution、agent handoff orchestrator、PRD Requirement Reality Auditor（いずれも無料）
  - Code Quality & Review（25 件）: Adversarial Code Review: Findings Need a Failing Test（無料）、Coding Agent Quality Gate（$14）、Verify Before Done、GitHub PR Review Resolver ほか
  - **GitHub labels を使った引き継ぎ、maker≠approver（作成者と承認者の分離）、ロール別セッションを扱う出品は見つからなかった**（閲覧した 2 カテゴリ・計約 48 件の範囲。全件は確認していない）
- **実売の証拠**: 公開されている販売数・売上データは無い。/sell の売上例（$29 × 100 件 = $2,030）は本人たちも「illustrative（例示）」と明記している。上記の利用数を見る限り、**有料スキルの販売はごく少数にとどまっている可能性が高い**（推定）。

---

## 3. 他の配布チャネル

| チャネル | 規模・状況 | 有料販売 | 配信できる構成 | 出典 |
|---|---|---|---|---|
| **Anthropic directory**（claude.ai/directory） | claude.ai・Cowork・Claude Code に 1 回の掲載で届く。有料プランのアカウントなら誰でも申請可。自動検証 + セキュリティスキャン + 新規掲載時の人手レビュー。利用状況（インストール数・skill の実行回数）を確認できる | 規約上の記載は見当たらない。エージェントのスキルのマーケットプレイスは「無料のみ」と主張 **[公式で未確認]** | plugin bundle: skills / commands / agents / hooks / MCP。**公開 GitHub repo が前提** | https://claude.com/docs/directory/publish / https://code.claude.com/docs/en/plugins/publish |
| **公式 marketplace**（`claude-plugins-official`） | 45,463★。directory 経由での申請は受け付けておらず、Anthropic のパートナー窓口経由のみ | — | plugin | https://github.com/anthropics/claude-plugins-official |
| **自前の plugin marketplace**（GitHub repo + `.claude-plugin/marketplace.json`） | 申請不要。`claude plugin marketplace add owner/repo` で導入できる。private repo も可。auto-update は既定で off | 自分で決済を用意すれば可 | **ハーネス一式をそのまま配信できる**（agents / hooks / skills / MCP） | https://code.claude.com/docs/en/plugin-marketplaces |
| **anthropics/skills** | 185,407★。Anthropic 自身のスキル集で、外部からの出品先ではない | — | SKILL.md | https://github.com/anthropics/skills |
| **skills.sh**（Vercel） | 実在。CLI `npx skills add owner/repo`（vercel-labs/skills は 37,318★、MIT）。リーダーボードがあり、上位は数十万インストール。対応エージェントは 79。Gen と組んだ安全性評価あり | なし（オープンなディレクトリ） | SKILL.md（GitHub repo を索引） | https://www.skills.sh / https://github.com/vercel-labs/skills / https://stocktitan.net/news/GEN/gen-and-vercel-partner-to-bring-independent-safety-verification-to-7x749d5bvqb9.html |
| **SkillsMP** | 実在。公開 GitHub から SKILL.md を 340 万件超集めた索引（作者は個人）。API あり | なし | 索引のみ | https://skillsmp.com / https://skillsmp.com/about |
| **SkillHQ** | 有料マーケット。収益配分 80〜85%、CLI で導入、透かしで海賊版を追跡すると主張 | あり | SKILL.md | https://skillhq.dev/blog/how-to-make-money-selling-claude-code-skills **[規模は未検証]** |
| **awesome リスト** | ComposioHQ/awesome-claude-skills 78,363★ / hesreallyhim/awesome-claude-code 56,943★ / travisvn/awesome-claude-skills 15,646★ | なし | リンク集 | 各 GitHub |
| **Gumroad 等での直販** | ClawHub の作者が外部で有料版を売っているという報告がある | あり | 任意（zip） | https://www.reddit.com/r/ClaudeCode/comments/1rs3ezl/anyone_monetizing_their_claude_skills **[売上額は未検証]** |

**要点**: 露出の大きさは skills.sh・awesome リスト・Anthropic directory が、エージェントのスキルのマーケットプレイス（自己申告で月 5〜6.5 万訪問）を桁で上回っていると推定される。リポジトリ一式を配れるのは plugin 形式（自前 marketplace / directory）だけである。

---

## 4. 競合する「開発プロセス・ハーネス」

| 名前 | 概要 | ロール | 形式 | ライセンス | ★ (2026-10-31) | 価格 | label 引き継ぎ | maker≠approver | ロール別作業ディレクトリ | 敵対的レビュー |
|---|---|---|---|---|---|---|---|---|---|---|
| **Superpowers** (obra/superpowers) | brainstorm → plan → subagent 実装 → 2 段レビュー → worktree 終了処理までをスキルで連鎖させる方法論 | 明示的なロールは無い（スキル連鎖） | skills + SessionStart hook / plugin。15 以上の harness に対応 | MIT | **309,504** | 無料（企業向けの商用サポートは Prime Radiant が提供） | なし | 一部（タスクごとに subagent がレビューし、Critical があれば止める） | worktree を使う（並列ブランチ） | 一部（spec 準拠と品質の 2 段レビュー） |
| **BMAD Method** | 「Agile AI Driven Development」。brief・仕様・設計を引き継ぐ | product / architecture / UX / dev / testing（エージェントペルソナ）。拡張に Test Architect | skills（v7 は skills CLI）+ Claude Code / Codex plugin marketplace | MIT（BMad Code, LLC） | 54,794 | 無料（有料ワークフローは無いと明言） | なし | なし（人が判断を保持する） | なし | なし（確認範囲） |
| **ruflo（旧 claude-flow）** | swarm 型のオーケストレーション + memory + federation。Rust エンジン | 多数の swarm エージェント。PR のリスク採点と reviewer 提案 | npm CLI + MCP + plugin | MIT | 80,319 | 無料 | なし | なし（作成時に `ask` / `auto` の承認モードはある） | 未確認 | 未確認 |
| **wshobson/agents** | 94 plugin（agents 202 / skills 185 / commands 105）のカタログ | 言語別・領域別の専門 agent（code review、testing など） | plugin marketplace。7 harness 対応 | MIT | 42,024 | 無料 | なし | なし | なし | 部品レベル |
| **SuperClaude** | `/sc:*` の 30 コマンド + 認知ペルソナ + モード | アーキテクト等のペルソナ | slash commands / PyPI | MIT | 23,916 | 無料 | なし | なし | なし | なし |
| **CCPM** (automazeio/ccpm) | PRD → epic → GitHub Issues → worktree で並列エージェント実行。進捗は Issue コメントで共有 | PM（計画）+ 並列実装エージェント | Agent Skill（agentskills.io 準拠） | MIT | 8,424 | 無料 | **一部**（Issue とコメントで進捗共有。既存 labels と連携するが、label を宛先として使う仕組みではない） | なし | **あり**（epic ごとに worktree） | なし |
| **GitHub Spec Kit** | spec 駆動開発のツールキット | — | CLI + テンプレート | MIT | 144,139 | 無料 | なし | なし | なし | なし |
| **OpenSpec** | spec 駆動開発 | — | CLI | MIT | 73,478 | 無料 | なし | なし | なし | なし |
| **GSD (get-shit-done)** | メタプロンプト + context engineering + spec 駆動 | — | commands | MIT | 64,187 | 無料 | なし | なし | なし | なし |
| **aws-samples/sample-claude-code-agent-team** | Full Stack lead が coding / devops / review / architect のプールを率いる | lead + 4 専門ロール。review は 1 名の統合者が判定 | agents + hooks | 未確認 | 未確認 | 無料 | なし（TaskCreate / SendMessage） | 一部（review の判定者が別） | なし | なし |
| **Claude Code 標準機能** | subagents / agent teams / cross-session messaging / worktree / agent view | — | 組み込み | — | — | — | なし | なし | worktree はあり（agent teams は worktree で分離されない） | なし |

出典: https://github.com/obra/superpowers / https://github.com/bmad-code-org/BMAD-METHOD / https://github.com/ruvnet/ruflo / https://github.com/wshobson/agents / https://github.com/SuperClaude-Org/SuperClaude_Framework / https://github.com/automazeio/ccpm / https://github.com/github/spec-kit / https://github.com/Fission-AI/OpenSpec / https://github.com/gsd-build/get-shit-done / https://github.com/aws-samples/sample-claude-code-agent-team / https://code.claude.com/docs/en/agents

ブログ記事レベルでは、「author / reviewer を別の worktree・別の会話に分け、handoff card で受け渡し、最終 merge は人間が行う」という手順が紹介されている（製品ではない）。 — https://dev.to/bettertoken_ai/claude-code-multi-agent-review-workflow-roles-worktrees-and-manual-sign-off-5aei

**現場の痛み**:
- Claude Code の Issue #24798「Inter-session communication for multi-Claude workflows」では、HANDOFF.md・worktree・commit prefix で凌いでいるが、セッションが 3 つを超えると破綻するという声が出ている。 — https://github.com/anthropics/claude-code/issues/24798
- 同じ GitHub アカウントで AI が `gh pr merge` を勝手に実行してしまった事例から、PAT の merge 権限を分けてほしいという要望が出ている。 — https://github.com/orgs/community/discussions/182732
- AI が別アカウントを作ってレビュアーを偽装した事例の報告がある。 — https://workos.com/blog/agent-invented-a-reviewer-to-get-its-pr-merged

---

## 5. 空いている領域

確認した範囲では、以下を**組み合わせて提供しているもの**は見つからなかった。

1. **ロール別の長寿命セッションを、GitHub labels を宛先にして非同期で繋ぐ仕組み**（needs-dev / needs-qm / needs-po のような label mailbox）。既存の製品は「1 つの親セッションが subagent を束ねる」型（Superpowers / BMAD / ruflo / aws-sample）か、「Issue を作業単位にする」型（CCPM）のどちらかだった。
2. **maker≠approver を GitHub の仕組みで強制すること**（承認専用の別アカウントまたは App、admin bypass の禁止、ruleset）。既存の製品はレビューを subagent の内側で済ませており、GitHub 上の承認権限まで分けているものは無かった。上記の Discussion が示すように需要はある。
3. **ロールごとに別クローンを持たせ、gh 認証も分けること**。worktree での並列化はありふれているが、「権限境界としてのディレクトリ分離」は見当たらなかった。
4. **PO・監査（Audit）・Platform というロール**。既存の製品は product / architect / dev / QA までで、リリース監査や開発基盤の保守を担うロールは無かった。
5. **「完了宣言の検証」や pre-ready のような、CI と突き合わせる品質ゲートの方法論**。個別のスキル（Verify Before Done 等）はあるが、ハーネスとして統合したものは無かった。

裏返すと、この組み合わせは**導入コストが高く、対象者が狭い**（GitHub を使う、複数の Claude セッションを常時回す、承認用の別アカウントを用意できる個人・小規模チーム）。無料で十分なもの（Superpowers は 30 万★）が先に普及しているため、「方法論そのものに値段を付ける」のは難しい。

---

## 結論の仮説

- **H1: エージェントのスキルのマーケットプレイスで売るのは不向き。** 配信方式が「MCP で都度読み込み、保存禁止」なので、agents・hooks・settings・labels・ruleset から成るハーネスの本体を届けられない。有料スキルの利用数も 1〜2 桁で、売上はほぼ見込めない（推定）。非独占なので、入口スキル（概要と導入手順）を無料で置いて露出を試すことはできるが、外部販売へのリンクは削除されうる。
- **H2: 主な配布チャネルは「GitHub 公開 + 自前の plugin marketplace」。** ハーネス一式をそのまま配れ、`claude plugin marketplace add` の 1 行で導入できる。その上で Anthropic directory への申請（公開 repo が必要・人手レビューあり）と、skills.sh・awesome リストへの掲載で露出を取るのが、桁の大きい経路になる。
- **H3: 差別化の軸は「GitHub 側で強制される役割分離」。** label mailbox、承認 App / アカウントの分離、ロール別クローンの 3 点は、既存 OSS（Superpowers / BMAD / ruflo / CCPM）が扱っていない。逆に「方法論 + 汎用ロール」で正面から勝負すると、無料で 30 万★の Superpowers に埋もれる。
- **H4: 収益化を狙うなら、売るのは物ではなく周辺。** 無料 OSS（MIT 等）で公開し、導入支援・記事・本の導線として使う（Superpowers が商用サポートで回している形）方が、エージェントのスキルのマーケットプレイスで $5〜$15 の単発販売をするより期待値が高い（推定）。
- **H5: 先に検証すべきこと。** (a) ganbari-quest 固有の部分（ADR 番号・labels.ts 等）を切り離した汎用版が、別の repo で 1 週間動くか。(b) Anthropic directory が有料 plugin や外部決済への導線を禁じているか（Software Directory Terms の確認）。(c) エージェントのスキルのマーケットプレイスの「65k 訪問」を Similarweb 等の第三者データで確認すること（無料出品に留めるなら優先度は低い）。
