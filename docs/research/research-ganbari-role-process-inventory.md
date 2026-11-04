# がんばりクエストのロール別・工程別プロセス棚卸し

- **調査日**: 2026-11-02
- **対象**: ganbari-quest-po クローン（develop 系、`docs/pre-ready-draft-direction` ブランチの作業ツリー）の `docs/sessions/` 全 22 ファイル、`.claude/skills/{po,dev,qm,platform,audit,issue-triage,dev-open-pr,impact-analysis,regression-check,pr-review,adversarial-reviewer,policy-compliance}/SKILL.md`、`.claude/agents/*.md`（5 本）、ルート `CLAUDE.md` と `docs/CLAUDE.md` のプロセス部分。すべて読み取りのみ
- **問い**: オーナーが汎用ハーネスに求める「各ロールの工程ごとに、考え方・調査範囲・調査の深さ・背景不明時・文書と実装の矛盾時…まで細かく決める」粒度に対して、がんばりクエストの現行定義はどこまで書いてあり、どこが欠けているか
- **結論（要約）**:
  1. 工程を**明示的に番号付きで定義しているのは QM（5 手順）と監査（9 ステップ）だけ**。Dev は「PR 作業時の手順 10 項目」「新規実装時 5 項目」「フェーズゲート 7 段」が別々の文書に散っていて、オーナーの例（調査 → 設計 → テスト設計 → テスト実装 → 実装 → テスト評価 → 手戻り）の形にはなっていない。PO と Platform は工程というより「決める範囲」と「やってはいけないこと」で書かれている
  2. 各工程で一番厚いのは **「すること」と「出口条件」**（コマンド・label・証跡の要件）。一番薄いのは **「考え方」「調査の深さ（いつ deep research するか）」「背景・目的が不明なとき」「文書同士・文書と実装が矛盾したとき」**。調査の深さを決める明文の決定木は issue-triage の「軽量 / 中規模 / 大規模」1 つだけで、PO の起票用
  3. 矛盾時の扱いは「チーム憲章 §0 が他に勝つ」という**プロセス文書間の優先順位**と、「後工程で前工程の不備を見つけたら元フェーズを再オープン」（completion-principles §7）しか無い。**設計書と実装が食い違ったときにどちらを正とするか**の手順は無い
  4. ロール定義どうしが食い違っている箇所が 20 件以上ある（§8.6）。多くは 2026-08-05 の §0（運用モード変更）に agent 定義・一部 skill が追随していないもの
  5. 量は 41 ファイル・7,482 行。汎用の方法論にあたる部分は概算で約 5 割（約 3,900 行）だが、skill と agent が docs を言い換えて重複しているため、**重複を除いた汎用の方法論は 2,000 行前後**と見積もる [推論]
- **根拠の水準**: 本文の引用・要約は、すべて上記ファイルの本文を読んだもの **[一次]**。割合の見積もりと「意図」の解釈は **[推論]** と書く
- **書かないこと**: 秘密情報、オーナーの勤務先に関すること。gh アカウント名は「作成用アカウント」「承認用アカウント」と一般名で書く


> **照合メモ（2026-11-02、設計者）**: 要の主張 6 点を原文で照合した。①§0 の日付（憲章 L10「2026-08-05〜」）②QM の 5 手順（qm-session.md「Per-PR Review Agent（5 手順）」手順 1〜5）③Dev の背景不明時の規定は「AC を読む。不明点は Issue にコメント確認」だけ（dev-session.md L217、agents/dev-session.md L122）④それと食い違う「mention とコメントは通知経路ではない」（label-mailbox.md §3.1.2 L103）⑤後工程で前工程の不備 → 元フェーズ再オープン（completion-principles.md §7 L102）⑥調査の深さの決定木は issue-triage の軽量 / 中規模 / 大規模（SKILL.md L164〜）。いずれも一致。監査の 9 ステップと §8.6 の 20 件は個別には照合していない（設計で使う箇所は使う時点で原文に当たる）。割合の見積もりは本文どおり [推論]。


> **前の調査との関係（2026-11-02 追記、設計者）**: 本書は **2 回目の棚卸し**である。1 回目（2026-10-31、`research-inventory.md`）は全文が残らず要約だけになっており、本書の調査を頼むときに設計者がそれを読ませなかった（オーナーの指摘で判明）。照合した結果:
> - **繰り返した点**: 汎用 / 値が固有 / 案件専用の仕分け（1 回目の 3 分類と本書 §7 の G / P / A）、完遂原則・調査の規律・impact-analysis が汎用であること、文書どうしの食い違い（pr-review Step 0 と憲章 §0 ルール 3 など）
> - **本書で新しい点**: 工程 × 観点（入口・すること・考え方・調査範囲・深さ・背景不明・矛盾・出口・成果物）の判定一覧（§1.2 ほか）、深さ・背景不明・矛盾の 3 観点が薄いことの把握、食い違い 20 件の表（§8.6）
> - **1 回目にあって本書が扱わなかった点**（設計では両方を使う）: ①会社で詰まった 3 点への対応状況。とくに「Dev の着手チェックリスト（調査 → スコープ → テスト設計 → 層の決定 → 実装）が無い」は、いま書いている工程定義の必要を 10-31 の時点で指摘していた ②設計書の矛盾ループへの不足（SSOT の優先順位表、同順位で矛盾したら裁定者に上げる、`needs-tech` と技術判断者、2 周で打ち切った後の遷移、process-compass の selfHealMaxIterations 3 / noProgress 2）③process-compass との対応（強い区間・弱い区間・標準からの逸脱）④効果の根拠（書籍）と「docs/sessions が 4 か月読み込まれていなかった」こと

---

## 0. 凡例と略称

### 0.1 判定の凡例

| 記号 | 意味 |
|---|---|
| **規定あり** | その工程・観点について、手順か判断基準が本文に書いてある（出典を付ける） |
| **一部** | 一部の場面だけ書いてある / 別工程・別ロール向けの規定を流用すれば読める / 抽象的な一文だけ |
| **規定なし** | 書いていない |

### 0.2 汎用性のタグ（§4 で使う）

| タグ | 意味 |
|---|---|
| **G** | 汎用の方法（どのプロジェクトでもそのまま使える考え方・手順） |
| **P** | 方法は汎用だが、値がプロジェクト固有（コマンド名・label 名・閾値・ファイルパス・cron の分） |
| **A** | がんばりクエスト固有（製品の事実・この repo の装置・過去の事故番号に依存し、他では意味を持たない） |

### 0.3 出典の略称

| 略称 | ファイル |
|---|---|
| 憲章 | `docs/sessions/README.md`（チーム憲章） |
| dev-s | `docs/sessions/dev-session.md` |
| qm-s | `docs/sessions/qm-session.md` |
| po-s | `docs/sessions/po-session.md` |
| pf-s | `docs/sessions/platform-session.md` |
| audit-t | `docs/sessions/audit-team.md` |
| mailbox | `docs/sessions/label-mailbox.md` |
| branch | `docs/sessions/branch-strategy.md` |
| teams | `docs/sessions/agent-teams.md` |
| concur | `docs/sessions/agent-concurrency.md` |
| clone | `docs/sessions/clone-setup.md` |
| qm-tpl | `docs/sessions/qm-agent-templates.md` |
| ui-chk | `docs/sessions/qm-checklist-ui-quality.md` |
| webui | `docs/sessions/webui-review-process.md` |
| dp/complete | `docs/sessions/dev-process/completion-principles.md` |
| dp/anti | `docs/sessions/dev-process/anti-patterns.md` |
| dp/lateral | `docs/sessions/dev-process/feature-change-lateral-spread.md` |
| dp/head | `docs/sessions/dev-process/github-api-head-staleness.md` |
| dp/parallel | `docs/sessions/dev-process/parallel-agent-ops.md` |
| dp/qmfix | `docs/sessions/dev-process/qm-fix-patterns.md` |
| dp/research | `docs/sessions/dev-process/research-discipline.md` |
| sk/po, sk/dev, sk/qm, sk/pf, sk/audit | `.claude/skills/{po,dev,qm,platform,audit}/SKILL.md` |
| sk/triage | `.claude/skills/issue-triage/SKILL.md` |
| sk/openpr | `.claude/skills/dev-open-pr/SKILL.md` |
| sk/impact | `.claude/skills/impact-analysis/SKILL.md` |
| sk/regress | `.claude/skills/regression-check/SKILL.md` |
| sk/review | `.claude/skills/pr-review/SKILL.md` |
| sk/adv | `.claude/skills/adversarial-reviewer/SKILL.md` |
| sk/policy | `.claude/skills/policy-compliance/SKILL.md` |
| ag/dev, ag/qm, ag/po, ag/pf, ag/audit | `.claude/agents/{dev-session,qm-session,po-session,platform-session,audit-manager}.md` |
| root | ルート `CLAUDE.md` |
| docs-c | `docs/CLAUDE.md` |

### 0.4 ロールの対応づけ

| オーナーの想定ロール | がんばりクエストのロール | 対応の根拠と注意 |
|---|---|---|
| Dev | **Dev** | そのまま対応。「どう作るか・いつ誰がやるか」を決める（憲章 §3.2 / §4.2） |
| QM | **QM** | そのまま対応。対象は feature → develop の個別 PR だけ（qm-s §レビュー対象レーン）。統合 PR は監査 |
| PO | **PO** | 対応するが、**決めるのは 2 つだけ**（顧客に見える文言・UX・価格の方針 / backlog の順序、憲章 §0 ルール 4）。Issue 起票・優先度付けの主体だった旧定義が agent 定義に残っている（§8.6） |
| 保守（maintenance） | **Platform** と **監査** に分かれる。完全一致は無い | Platform = 開発基盤（検査 script・workflow・テンプレート・CLAUDE.md）の**削減・統合・自動生成**。製品コードの保守ではない（憲章 §3.4）。監査 = release cut・統合 PR・本番 deploy 後の health check・deps 供給線の監査（audit-t §3.5.1 / §3.8）。依存更新（Dependabot）は QM が扱う（qm-s §Dependabot）。docs の定期棚卸（ADR 月 1 / codebase-map 4 半期）は**どのロールにも割り当てられていない**（docs-c §ADR 月 1 棚卸） |
| （無し） | **オーナー** | 不可逆 4 操作（本番データ削除 / 本番 deploy / 課金書込 / スキーマ変更）の最終決裁とロール間の中継（憲章 §3.1 / §4.4） |

**重要な前提**: 憲章 §0（2026-08-05〜）は「§1 以降と食い違ったら、こちらが勝ちます」と宣言し、po-s / dev-s も冒頭で §0 優先を明記している。しかし agent 定義（ag/*）と一部 skill は §0 より古い運用を書いたまま残っている（§8.6）。本棚卸しは **§0 を現行として読み、食い違いは食い違いとして記録する**。

---

## 1. Dev

### 1.1 工程の一覧 — プロジェクトの定義とオーナーの例の対応

がんばりクエストに「Dev の工程」を 1 本に並べた定義は無い。工程らしい並びは 4 か所に分かれている。

| 出典 | 並び |
|---|---|
| dev-s §新規実装時 | ① AC を読む（不明点は Issue にコメント）② 設計書を先に確認 ③ 並行実装チェック ④ テスト同梱 ⑤ UI の目視 |
| dev-s §PR 作業時の手順 | ① 最新化・基点鮮度 ② PR / Issue / レビューコメント確認 ③ 指摘を全件修正 ④ pre-ready 全 step PASS ⑤ AC 検証マップ全行 ⑥ gh アカウント確認 ⑦ 雛形から Draft PR ⑧ UI は SS ⑨ Ready 化前 4 gate ⑩ CI 通過後 Ready |
| ag/dev §フェーズゲート | ① 設計書確認 ② 実装 + テスト ③ 並行実装チェック ④ 設計書同期 ⑤ UI 目視 ⑥ CI 全緑 ⑦ PR |
| sk/dev §1〜§7 | 起動（cron）→ polling → 着手順は Dev が決める → 実装（テストファースト）→ Ready 化 → QM 差し戻し対応 → エスカレーション |

本棚卸しでは、これらを統合して次の 10 工程に並べ直した（名前は本棚卸しで付けたもの）。

| # | 本棚卸しの工程名 | オーナーの例との対応 | プロジェクト側の主な出典 |
|---|---|---|---|
| D0 | 受付（mailbox） | （例に無い） | dev-s §セッション起動時 / mailbox §4 / sk/dev §1-2 |
| D1 | 着手判断と計画（直列 / 並列・委任） | （例に無い） | dev-s §委任ポリシー / 憲章 §4.2 / dp/parallel §3 |
| D2 | 調査 | **調査・研究** | dev-s §新規実装時 ①-③ / sk/impact / dp/research / dp/complete §4 / dev-s §実装モダン性 |
| D3 | 設計・方針合意 | **設計** | dev-s §設計ポリシー先行確認 / §3 つ目の類似 / §段階的リリース禁止 / §UI 指摘 A〜D |
| D4 | テスト設計 | **テスト設計** | sk/dev §4（テストファースト）/ sk/review C（failing-test-first）/ dev-s §重量 e2e 敏感領域 / sk/openpr §CX-DoR |
| D5 | テスト実装 | **テスト実装** | dev-s §新規実装時 ④ / §過去に 2 度以上受けた指摘 / dp/anti §3 |
| D6 | 実装 | **実装** | dev-s §必ず守ること / dp/lateral / ag/dev §並行実装チェック |
| D7 | テスト評価と Ready 化 | **テスト評価** | dev-s §PR 作業時 ④-⑩ / sk/openpr / ag/dev §Ready 化前 5 項目 / dp/qmfix §Self-Review HONESTY |
| D8 | 手戻り | **手戻り** | sk/dev §6 / mailbox §3.1.1 / dp/complete §3, §7 / branch §3 SOP |
| D9 | hotfix（特別経路） | （例に無い） | dev-s §hotfix PR runbook / branch §5 |

### 1.2 工程 × 観点の判定一覧

| 工程 | 入口 | すること | 考え方 | 調査範囲 | 調査の深さ | 背景不明 | 矛盾時 | 出口 | 成果物 |
|---|---|---|---|---|---|---|---|---|---|
| D0 受付 | 規定あり | 規定あり | 一部 | 規定あり | 規定なし | 規定なし | 規定なし | 一部 | 規定あり |
| D1 計画 | 一部 | 規定あり | 規定あり | 規定なし | 規定なし | 規定なし | 規定なし | 一部 | 一部 |
| D2 調査 | 一部 | 規定あり | 規定あり | 規定あり | 一部 | 一部 | 一部 | 一部 | 一部 |
| D3 設計 | 規定あり | 規定あり | 一部 | 一部 | 一部 | 一部 | 一部 | 規定あり | 規定あり |
| D4 テスト設計 | 一部 | 一部 | 一部 | 一部 | 規定なし | 規定なし | 規定なし | 規定なし | 一部 |
| D5 テスト実装 | 規定なし | 規定あり | 規定あり | 一部 | 規定なし | 規定なし | 一部 | 一部 | 一部 |
| D6 実装 | 一部 | 規定あり | 規定あり | 規定あり | 一部 | 規定なし | 一部 | 一部 | 規定あり |
| D7 テスト評価 | 規定あり | 規定あり | 規定あり | 規定あり | 規定なし | 規定なし | 一部 | 規定あり | 規定あり |
| D8 手戻り | 規定あり | 規定あり | 規定あり | 一部 | 規定なし | 一部 | 規定あり | 規定あり | 規定あり |
| D9 hotfix | 規定あり | 規定あり | 一部 | 一部 | 規定なし | 規定なし | 規定なし | 規定あり | 規定あり |

### 1.3 工程ごとの詳細

#### D0 受付（mailbox）

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | セッション起動直後。`CronCreate` は セッション内メモリのみで 7 日で失効するため、セッションごとに作り直す | 規定あり / dev-s §セッション起動時、mailbox §3.4 |
| すること | 毎時 polling で拾う: `state:needs-dev`（Issue と PR の両方）/ `state:qm-blocked` / 自分宛の reviewer request / ORPHAN（`state:*`・`status:on-hold`・`epic` のいずれも無い open）。ORPHAN は担当なら `needs-dev` を付けて拾い、他ロールなら該当 state を付けて渡す。「放置しない」 | 規定あり / mailbox §4 Dev 用、sk/dev §2 |
| 考え方 | 「書いたかどうかではなく、相手のクエリに出るかどうかが伝達の成否を決める」。「cron の結果で主線を中断しない。数分で終わるものだけ差し込む」。「mailbox 空」を「やることが無い」と読まない | 一部 / dev-s §セッション起動時、mailbox §5 |
| 調査範囲 | Issue と PR の両方（`gh pr list --label` は Issue を返さない） | 規定あり / mailbox §3.3 |
| 調査の深さ | — | 規定なし |
| 背景不明 | — | 規定なし |
| 矛盾時 | — | 規定なし |
| 出口条件 | 拾ったものに state を付けた / 主線に戻った。何を拾ったら主線を切り替えるかの基準は「数分で終わるか」だけ | 一部 / mailbox §4 |
| 成果物・受け渡し | 空でも「mailbox 空」の 1 行を報告（cron の生死を見分けるため） | 規定あり / mailbox §5 |

#### D1 着手判断と計画

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | backlog（`status:on-hold` が付いていないもの）。「hold は上位に入っていないことを示すだけで、着手を禁じる意味ではない」 | 一部 / dev-s §status:on-hold、mailbox §3.2 |
| すること | 何を今のレーンに取り込むか・着手順・WIP・直列 / 並列・teammate 構成・モデル割当を Dev が決める。既定は **1 件ずつ直列**（前の PR が Ready・CI 全緑になってから次へ）。軽微 Issue 群だけ Plan agent が事前に仕分けて並列可。並列許容 6 条件（修正ファイル非重複 / 並行実装ペア非接触 / DB 変更なし / 設計書同期不要か独立 / critical でない / 単独で AC 完結）。重大 Issue は本体が primary implementer、Agent は同じ Issue の多観点セルフレビューにだけ使う | 規定あり / dev-s §委任ポリシー、憲章 §4.2、dp/parallel §3 |
| 考え方 | 「重大変更でルール見落とし・手戻りを防ぐため」既定は直列。「判断に迷う場合は直列にフォールバック（安全側）」。PO が「これを先に」と個別指示すると Dev の self-management が消え PO がボトルネックになる。モデル割当は「安いから」だけを根拠に落とさない（判定材料が無い間は据え置き） | 規定あり / dev-s §委任ポリシー、§subagent の model 指定、憲章 §4.2 注記 |
| 調査範囲 | 着手前にどこまで見積もるかは書いていない | 規定なし |
| 調査の深さ | — | 規定なし |
| 背景不明 | — | 規定なし |
| 矛盾時 | — | 規定なし |
| 出口条件 | 直列なら「前 PR が Ready / CI 全緑」。計画そのものの完了条件は無い | 一部 / dev-s §委任ポリシー |
| 成果物・受け渡し | 上位に入れてほしい / hold を外してほしいときは `state:needs-po`。計画を残す場所は規定なし | 一部 / dev-s §status:on-hold |

#### D2 調査

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | 着手時。impact-analysis は「rename / API 廃止 / DB schema 変更 / プラン・用語の根本変更 / 設計層の境界変更 / LP・法務・用語辞書改訂 / 50 ファイル超 / 撤去（teardown）」の**着手前**に必須 | 一部（impact-analysis のみ明確）/ sk/impact §起動タイミング |
| すること | ① AC を読む ② 設計書を先に確認（DESIGN.md → 関連設計書）③ 並行実装ペアの確認（`parallel-implementations.md`）④ 10 行超の独自実装になりそうなら OSS / 確立パターンを 2 件以上比較 ⑤ 触れたコードの「モダン性」を疑う（一次ソース 2 件以上で裏取り、同 class の残存を grep で全件）⑥ 影響範囲は 4 layer（L1 構文 = grep + ast-grep / L2 意味 = ts-morph・LSP / L3 構造 = knip・depcruise / L4 派生 artifact 22 カテゴリの目視） | 規定あり / dev-s §新規実装時、§実装モダン性、sk/impact §4 layer、ag/dev §PR 作成フロー ④ |
| 考え方 | **調査規律の 2 段**: (1)「正しい問い」— 一般論ではなく自プロダクトの前提条件（実行基盤 / 顧客 / 開発体制 / 段階 / 制約）から問いを立て、顧客が離脱する failure class から逆算する (2)「仮説中立の framing」— agent に「裏付けよ」「疑え」と頼まず「事実を列挙し評価せよ」と頼む、反証事例を最低 3 件、業界事例は補強であって決定根拠ではない。impact-analysis は Bohner & Arnold の 3 分類（Traceability / Dependency / Experiential）を併用し、「grep で○○件確認、影響範囲調査完了」と書くことを禁止 | 規定あり / dp/research §1-3、sk/impact §Bohner & Arnold、§禁忌 |
| 調査範囲 | 並行実装ペア（UI ラベル / 本番 ↔ デモ / アプリ ↔ LP / ナビ面 / DB スキーマ 3 箇所）。用語・ラベル変更は `grep -rn` で全出現箇所。機能変更は LP / pricing / faq に同類訴求があるか。DB schema は 4 dimension（schema / create-tables / structural migration / data copy）＋ test-db / global-setup / demo-data / integration の inline table。impact-analysis L4 の 22 カテゴリ（データ永続 / キャッシュ / 外部 SaaS / 分析監視 / 顧客接点 / CI/CD / テスト記録 / 撤去系） | 規定あり / dev-s §並行実装、dp/lateral §1-3、sk/impact §22 カテゴリ |
| 調査の深さ（いつ deep research するか） | 明文の決定木は Dev 向けには無い。手掛かりは散在: 「妥協前に世界中の OSS / サービスを調査（最低 30 分）」（はりぼて実装に逃げそうなとき）、「再現不可能の判定は 30 分以上調査して mock / E2E で代替を試みた後」、「一次ソース 2 件以上」、impact-analysis の起動条件。**深さを決める規模判定（軽量 / 中規模 / 大規模）は issue-triage 手順 C にあるが PO の起票用** | 一部 / dp/complete §2, §4、dev-s §実装モダン性、sk/triage 手順 C |
| 背景・目的が不明なとき | 「AC を読む。不明点は Issue にコメント確認」だけ。ただし mailbox §3.1.2 は「コメントは通知経路ではない」と定めており、コメントだけでは誰にも届かない。PO に上げてよいのは「顧客に見える文言・UX・価格の方針 / backlog 順序」だけ（それ以外は Dev か QM が決める）。po-s は「推測を書かない。実測していない事象は『未確認』と明示する」。目的不明のまま着手してよいか・止めるべきかの判断基準は無い | 一部 / dev-s §新規実装時 ①、mailbox §3.1.2、憲章 §0 ルール 4、po-s §Issue を起票する基準 |
| 文書同士・文書と実装の矛盾 | プロセス文書間は「憲章 §0 が §1 以降に勝つ」。設計書は実装の SSOT（ADR-0001、「書かれていない仕様は存在しない仕様」）。後工程で前工程（要件・設計）の不備を見つけたら、その PR でつじつまを合わせず元フェーズを再オープンして先に直す（scope creep と実質設計欠陥の判別表付き、迷ったら「触らない」）。QM 側には「base 側ファイルも API から取る（stale な作業ツリーと比べると存在しない矛盾を報告する）」。**設計書と実装が食い違ったとき、どちらを正として直すかの判断手順は無い** | 一部 / 憲章 §0、docs-c §設計書更新ルール、dp/complete §7、qm-s §base 側ファイル |
| 出口条件 | impact-analysis は 22 カテゴリ checklist を PR body に転記し各項目に結果を書く（対象外も明示）。調査全体の完了条件は無い | 一部 / sk/impact §適用フロー |
| 成果物・受け渡し | 調査結果は `tmp/` に保存し PR body に転記（impact）。OSS 調査は PR body §OSS 先調査（調査キーワード / 検討した OSS・不採用含む / 採用根拠）。用語変更は「grep 結果: N 箇所中 N 箇所修正、除外理由」を変更説明に | 一部 / sk/impact §適用フロー、dp/complete §4、dp/lateral §1 |

#### D3 設計・方針合意

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | 新テーブル / 新スキーマ / 新 interface / セキュリティ機能 / 課金変更 / AWS リソース追加 / 3 人日以上 →「実装着手前」に PO 合意必須 | 規定あり / dev-s §設計ポリシー先行確認、憲章 §4.2 |
| すること | 合意根拠（「PO 設計承認済み」label / ADR 先行起票 + Issue リンク / Issue コメントでの明示同意のいずれか）を得て PR 本文「設計ポリシー確認」に記載。3 つ目の類似 service / component で Strategy / Factory / Registry の適用を判断（適用しないなら理由 1 行）。段階的リリース禁止（stub / no-op / TODO の merge 禁止、複数 backend は全 backend 完成必須）。UI 指摘は A（画面固有）/ B（コンポーネント設計）/ C（配置・振る舞い）/ D（ガイドライン欠落）に仕分け、B〜D を A で済ませない | 規定あり / dev-s §設計ポリシー先行確認、§3 つ目、§段階的リリース禁止、§UI レビュー指摘の一般化義務、webui §4 |
| 考え方 | 「複雑度最小化の主語は常にユーザ」（内部バリアント数ではない）。「やるべきか」で判断し scope を理由に回避しない。A〜D の判定基準は「同じ指摘が別画面でも成立するか」。Pre-PMF では interface を追加すべきかを ADR-0010 で判定 | 一部 / dp/anti §11、dev-s §UI、§段階的リリース禁止 |
| 調査範囲 | 抽象化判断のための「既存実装件数」（1 件目 / 2 件目 / 3 件目）。それ以外の設計時調査範囲は D2 に依存 | 一部 / dev-s §3 つ目、sk/triage 手順 F |
| 調査の深さ | OSS 先調査（2 件以上、10 行超の独自実装前）。設計判断そのものに deep research を使う条件は無い | 一部 / docs/decisions/README §OSS 先調査ルール（sk/dev §4 経由） |
| 背景不明 | 妥協が発生するなら「選択肢を 2〜3 個用意して PO に明示質問」（dp/complete §4）。ただし §0 ルール 4 では PO の決裁範囲外（実装方針は Dev が決める）で、両者が衝突（§8.6） | 一部 / dp/complete §4、憲章 §0 |
| 矛盾時 | 前工程の要件・データ構造・URL 規約の修正が論理的に必須なら元フェーズを再オープン、大規模な巻き戻しは ADR-0008 に従い PO と合意 | 一部 / dp/complete §7 |
| 出口条件 | 合意根拠が GitHub 上にある（「合意根拠なしで着手しない」） | 規定あり / dev-s §設計ポリシー先行確認 |
| 成果物・受け渡し | PR 本文「設計ポリシー確認」節 / ADR / PR description に A〜D の仕分け結果と根拠 1 行 | 規定あり / dev-s §設計ポリシー先行確認、§UI |

#### D4 テスト設計

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | 「受入基準を先にテストケース化する（テストファースト）」。バグ修正は「再現テスト → 修正」順 | 一部 / sk/dev §4、sk/review C |
| すること | AC → テストケース。バグ修正は修正前に失敗し修正後に green になるテストで原因を pin（failing-test-first）。重量レーンで露見した不具合は unit / lint / fitness function に降ろせないか検討（push-down-the-pyramid）。同一 class が 2 回以上再発した領域は class 全体を lock する guard（same-class-N→guard）。重量 e2e 敏感領域（export/import schema・marketplace schema・reward 陳列・domain validation 値域・child shop・parent-gate・DB スキーマ）は着手前に (a) 並行実装ペア (b) 該当重量 e2e のローカル実行 (c) e2e seed / test-db 同期 (d) domain 値域 ⊆ wire schema 値域 をセルフチェック。customer-facing PR は CX-DoR 8 条件の per-PR 列 | 一部 / sk/review C、dev-s §重量 e2e 敏感領域、sk/openpr §CX-DoR |
| 考え方 | 「軽量レーン緑 = 安全」と誤認しない。「発生源（着手時）で断つのが最も安い」 | 一部 / dev-s §重量 e2e 敏感領域 |
| 調査範囲 | 敏感領域の判定は `parallel-implementations.md` §重量 e2e 敏感領域 SSOT。境界値・異常系・競合（pr-review C は QM 側の観点として列挙） | 一部 / dev-s、sk/review C |
| 調査の深さ | — | 規定なし |
| 背景不明 | AC が曖昧で検証可能な形にならないときの扱いは無い | 規定なし |
| 矛盾時 | — | 規定なし |
| 出口条件 | テスト設計を「終えた」と言える条件は無い | 規定なし |
| 成果物・受け渡し | 重量 e2e の PASS ログを PR body に残す。テスト設計書・テストケース一覧という成果物は Dev には無い（監査 step 4 にはある） | 一部 / dev-s §重量 e2e 敏感領域、audit-t §3.8 step 4 |

#### D5 テスト実装

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | — | 規定なし |
| すること | テスト同梱必須（テストなし機能 PR 禁止）。guard の fixture に「規則から外れた実在物」（手動退避ファイル・サブディレクトリ・旧命名の残骸）を実名で混ぜる。構造化識別子は prefix / suffix 一致ではなく正規表現の完全一致で判定する。guard を書いたら「外すと fail するか」を実行して証跡に貼る | 規定あり / dev-s §新規実装時 ④、§過去に 2 度以上受けた指摘 |
| 考え方 | 「規則に従うデータだけの fixture は、規則違反を検出できないことを検出できない」。assertion を弱めない（`toBeTruthy` への置換 / timeout 延長で flake 扱い / snapshot 差し替え / `skip`・`.only` / `expect.anything()` を点検）。弱めるなら理由と代替手段を併記 | 規定あり / dev-s、dp/anti §3 |
| 調査範囲 | ADR-0005 のテスト品質（`tests/CLAUDE.md` 参照指示のみ） | 一部 / dev-s §新規実装時 ④ |
| 調査の深さ | — | 規定なし |
| 背景不明 | — | 規定なし |
| 矛盾時 | 「落ちたテストが実装不在を教えている場合、消すと次は誰も気づけない」— テストと実装が食い違ったら実装側を直す | 一部 / dev-s §QM から返ってくるもの、sk/dev §4 |
| 出口条件 | guard が「外すと落ちる」ことを確認済み | 一部 / dev-s |
| 成果物・受け渡し | 外して落ちた証跡を PR に貼る | 一部 / dev-s |

#### D6 実装

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | D3 の合意（該当時）。branch は develop から切り、base は develop（hotfix のみ main）、作成直後に基点鮮度を機械検証 | 一部 / dev-s §PR 作業時 ①、branch §3 SOP |
| すること | デザインシステム（トークン・primitive・用語 SSOT・インラインスタイル禁止）。並行実装の全ペアに同じ変更。設計書の同期更新（同一 PR 内、別 Issue 切り出し禁止）。`process.env` 直参照禁止。UI は自分の目で見る（「ローカルブラウザで触っていない UI 変更は未完成」）。スクラップ & ビルドでは完全削除・互換レイヤーを残さない | 規定あり / dev-s §必ず守ること、dp/complete §6、ag/dev §PR 作成フロー |
| 考え方 | 「機能が動いている」と「実装が洗練されている」は別。はりぼて典型シグナル（「shim として」「足場として」「ひとまず動く」「とりあえず」「等価性は別 Issue で」/ `any`・`as unknown as`）を書き始めたら即停止。「1 画面だけ直って他が壊れている」が最多の顧客クレーム型 | 規定あり / dev-s §実装モダン性、dp/complete §4、dp/lateral §1 |
| 調査範囲 | D2 の範囲を実装中も維持（並行実装・LP 波及・DB 4 dimension） | 規定あり / dp/lateral |
| 調査の深さ | 「気になったら一次ソース 2 件以上で裏取りしてから直す」 | 一部 / dev-s §実装モダン性 |
| 背景不明 | — | 規定なし |
| 矛盾時 | 「スコープ外の問題は同じ PR で直す（軽微）か、その場で別 PR（大規模）」— 気づいた不備を Issue にせず PR にする | 一部 / dp/anti §1、憲章 §0 ルール 7 |
| 出口条件 | 完了基準は D7 に集約 | 一部 |
| 成果物・受け渡し | 設計書差分 / 横展開の grep 結果 / SS（UI 変更時 4 スロット: 修正前・後 × Mobile・PC） | 規定あり / dev-s §SS 撮影ガイド |

#### D7 テスト評価と Ready 化

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | 実装完了。Draft のまま進め、CI 全緑を確認する前に Ready にしない | 規定あり / dp/anti §6 |
| すること | `pre-ready` 全 step PASS → `gh pr checks` で CI 側の検査が **pass（skipping ではない）**ことを確認。`unit-test` が skip された PR は Ready にしない、`ci-gate` green を根拠にしない。AC 検証マップを全行（コマンド結果 / SS パス / grep 結果）。SS は push + embed が終わるまで Ready 禁止。「描画変化なし」を主張するなら微小変更を箇条書き。多観点セルフレビュー（UI / 認可 / テスト / リファクタ / 全体整合の各観点で別 agent、指摘の採否は本体が判断）。完遂報告には Fix item ごとの検証コマンドと件数の表 | 規定あり / dev-s §PR 作業時 ④-⑩、§SS push + embed、§描画変化なし、§多観点セルフレビュー、ag/dev §Fix 完遂検証 log |
| 考え方 | 「証跡コマンド添付なしの PASS は false PASS と同等」。並走したローカル検証は「落ちた」も「通った」も根拠にならない（負荷が偽の red を作る）→ フルスイートは CI を正とする。Agent 指摘を鵜呑みにしない | 規定あり / dp/qmfix §Self-Review HONESTY、concur §2、branch §4.1、dev-s §やってはいけないこと |
| 調査範囲 | CI の個別 job（vitest / cspell / license-key-leak / LP 寸法 等は pre-ready 外で CI 側が hard-fail）。「全件」と書く前に全 scope を grep | 規定あり / dev-s §PR 作業時 ④、ag/dev §Fix 完遂検証 log |
| 調査の深さ | — | 規定なし |
| 背景不明 | — | 規定なし |
| 矛盾時 | 自分の変更が原因でない CI 失敗も放置しない（その場で修理 PR）。「原因調査中」「自分のせいではない」の曖昧記述は禁止 | 一部 / dp/anti §7 |
| 出口条件 | Ready 化の条件: pre-ready 全 PASS / CI pass（skip でない）/ AC マップ / 必須セクション / SS embed。Done の条件: ゴール各項目が「文字通り」達成されていることを実機・証跡で確認（実画面未確認の `[x]` は検証偽装） | 規定あり / dev-s §PR 作業時、dp/complete §5 |
| 成果物・受け渡し | PR body（雛形は `dev:open-pr`、`--body-file` 必須）。Ready 化したら古い state を外して `state:dev-done`。完成前に相談したいだけなら `state:needs-qm` | 規定あり / sk/openpr、sk/dev §5 |

#### D8 手戻り

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | `state:qm-blocked`。QM から返ってくるのは 2 つだけ: 実装方針の変更 / BLOCK 3 類型（顧客に実害・証跡の真正性・不可逆）。PR body・AC の書き方・軽微な test / lint は QM が直して merge するので待たない。base が進んだら BLOCK を待たず rebase | 規定あり / sk/dev §6、dev-s §QM から返ってくるもの、branch §3 SOP |
| すること | 「症状ではなく事由に対処する」（例: テストの赤は症状、事由は「commit の主張が HEAD に存在しない」）。対応後 CI 緑で `qm-blocked` → `dev-done` に戻す（復路）。UI 変更 PR は rebase 後に SS 再撮影 | 規定あり / sk/dev §6、mailbox §3.1.1 |
| 考え方 | 困難時は fix-forward。close & restart / scope 分割 / Phase 切り直し / follow-up Issue に逃げない。進捗は PR 数ではなく動く成果物で測る | 規定あり / dp/complete §3 |
| 調査範囲 | 前回 BLOCK の事由と、それが HEAD に反映されたか（QM の Re-Review が独立に grep 件数を突き合わせる前提で、Dev は Fix 完遂 log を残す） | 一部 / qm-s §Re-Review、ag/dev §Fix 完遂検証 log |
| 調査の深さ | — | 規定なし |
| 背景不明 | BLOCK 事由の意図を確認したいときは `state:needs-qm`（完成前でも送れる） | 一部 / dev-s §セッション起動時 |
| 矛盾時 | 前工程の不備なら元フェーズ再オープン（D2 参照）。scope 分割が正当なのは 4 条件（1 PR で不可能 / 各 phase が独立デプロイ可能 / PO 明示承認 / 各 phase で顧客に見える進捗）を全部満たすときだけ | 規定あり / dp/complete §3, §7 |
| 出口条件 | CI 緑 + label を `dev-done` に戻した | 規定あり / mailbox §3.1.1 |
| 成果物・受け渡し | 修正 commit（amend 禁止・`--force-with-lease`）、Fix 完遂検証 log | 規定あり / ag/dev §Git 運用 |

#### D9 hotfix

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | `priority:critical` の本番修正。main から `fix/*` を切り main 向け PR | 規定あり / branch §5 |
| すること | 5 ステップ: ① 雛形 `--kind critical-fix` ② 機能仕様変化なしなら内部 refactor label ③ 新規 env は 4 経路の配布証跡 ④ env 直参照禁止 ⑤ pre-push 系 3 種 / pre-ready。重量 gate と Critical 5 要件（E2E 回帰 / AC 全完了 / 提案全実装 / 5 年齢モード / 30 日重複変更チェック）を省略しない。merge 後に develop へ back-merge | 規定あり / dev-s §hotfix PR runbook、root §Critical バグ修正 |
| 考え方 | 「urgency 文脈で品質ゲート bypass の誘惑を構造的に止める」。「hotfix 緊急時こそ pre-ready を回す」 | 一部 / dev-s §hotfix |
| 調査範囲 | 直近 30 日の同一ファイル変更 PR | 一部 / ag/dev §Critical |
| 調査の深さ / 背景不明 / 矛盾時 | — | 規定なし |
| 出口条件 | back-merge 完了までが Done（QM 側の定義） | 規定あり / qm-s §全手順 Pass |
| 成果物・受け渡し | PR body の Critical 要件欄 / env 配布節 | 規定あり / sk/openpr §kind 別 |

---

## 2. QM

### 2.1 工程の一覧

QM は番号付きの工程を持つ唯一のロール（「Per-PR Review Agent（5 手順）」と「subagent ループ ①〜④」）。オーナーは QM の工程例を挙げていないので、汎用的な「受付 → 準備 → 検証 → 判定 → 修正ループ → 出荷 → 事後」に対応させた。

| # | 本棚卸しの工程名 | プロジェクトの呼び名 | 主な出典 |
|---|---|---|---|
| Q0 | 受付・レーン判別 | mailbox / §レビュー対象レーン / ① 対象を拾う | qm-s、mailbox §4 QM 用、sk/qm §2 |
| Q1 | 対象確定と前処理 | 事前準備（Authoritative HEAD / base を API から）+ merge-base 測定 | qm-s §① / §事前準備、dp/head |
| Q2 | 要求照合 | 手順 1 Issue 照合 | qm-s §手順 1 |
| Q3 | 画面の検証 | 手順 2 SS 実視認 / 手順 3 SS 欠落検知 | qm-s §手順 2-3、ui-chk、webui §5 |
| Q4 | CI の判定 | 手順 4 CI ステータス確認 | qm-s §手順 4、§gh pr checks |
| Q5 | 合否判定 | 手順 5 承認 / マージ判断 | qm-s §手順 5、§BLOCK 基準、sk/review |
| Q6 | 修正・再レビューループ | ② 修正 subagent / ③ 再レビュー / Re-Review / CI Fix | 憲章 §0 ルール 2、qm-s §②③ / §Re-Review、qm-tpl |
| Q7 | 承認・merge・事後 | ④ 承認・merge（lead） | qm-s §④ / §全手順 Pass、sk/qm §6-7 |
| Q8 | 問い合わせ応答 | `state:needs-qm` | mailbox §3.1.1 |

### 2.2 工程 × 観点の判定一覧

| 工程 | 入口 | すること | 考え方 | 調査範囲 | 調査の深さ | 背景不明 | 矛盾時 | 出口 | 成果物 |
|---|---|---|---|---|---|---|---|---|---|
| Q0 受付 | 規定あり | 規定あり | 一部 | 規定あり | 規定なし | 規定なし | 規定なし | 一部 | 規定あり |
| Q1 前処理 | 規定あり | 規定あり | 規定あり | 規定あり | 規定なし | 規定なし | 規定あり | 一部 | 一部 |
| Q2 要求照合 | 規定あり | 規定あり | 一部 | 一部 | 規定なし | 規定なし | 一部 | 一部 | 規定あり |
| Q3 画面検証 | 規定あり | 規定あり | 規定あり | 規定あり | 規定なし | 規定なし | 一部 | 規定あり | 規定あり |
| Q4 CI 判定 | 規定あり | 規定あり | 規定あり | 規定あり | 規定なし | 規定なし | 規定あり | 規定あり | 一部 |
| Q5 合否判定 | 規定あり | 規定あり | 規定あり | 一部 | 規定なし | 一部 | 一部 | 規定あり | 規定あり |
| Q6 修正ループ | 規定あり | 規定あり | 規定あり | 一部 | 規定なし | 規定なし | 一部 | 規定あり | 規定あり |
| Q7 出荷・事後 | 規定あり | 規定あり | 一部 | 一部 | 規定なし | 規定なし | 規定なし | 規定あり | 規定あり |
| Q8 問い合わせ | 規定あり | 一部 | 一部 | 規定なし | 規定なし | 規定なし | 規定なし | 規定あり | 規定あり |

### 2.3 工程ごとの詳細

#### Q0 受付・レーン判別

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | 毎時 cron。拾うのは `state:needs-qm`（問い合わせを含む）/ `state:dev-done` / `state:ready-to-merge`。自衛として自分が block した `qm-blocked` も polling し、block 時点の HEAD から動いていれば再レビュー | 規定あり / qm-s §セッション起動時 |
| すること | base branch でレーン判別: base=develop → 軽量 / base=main かつ head=`release/*` → 統合（QM 対象外、監査）/ base=main かつ head=`fix/*` → hotfix（重量 gate）/ base=main でそれ以外 → base 誤設定として Fix Agent が develop へ訂正 + rebase。`fix/*` で critical label が無い PR は安全側で hotfix 扱いにして linked Issue を確認 | 規定あり / qm-s §レビュー対象レーン |
| 考え方 | 「label は状態であって指示ではない」。差し戻しコストが高いので base 誤設定は差し戻さず QM が直す | 一部 / mailbox §2、qm-s |
| 調査範囲 | `gh pr list --json baseRefName,headRefName,isDraft,reviewDecision,...` | 規定あり / qm-s §① |
| 調査の深さ / 背景不明 / 矛盾時 | — | 規定なし |
| 出口条件 | 対象は `isDraft:false` かつ未 approve。0 件なら「Ready PR なし」を記録して終了 | 一部 / qm-s §① |
| 成果物・受け渡し | 報告は「CI 個別行の実測を先に書き、結論はその後」 | 規定あり / qm-s §セッション起動時 |

#### Q1 対象確定と前処理

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | 5 手順に入る前に必ず | 規定あり / qm-s §事前準備 |
| すること | `git merge-base origin/<base> <head>` を測る（空なら orphan branch → base から切り直させる）。差分は three-dot で見る。`git ls-remote` で authoritative HEAD SHA を取り、以降の全検証で固定参照。base 側ファイルも作業ツリーではなく `git show origin/develop:<path>` / API で取る。作業は `/c/tmp/` の worktree（共有クローンで checkout しない） | 規定あり / qm-s §① / §事前準備、dp/head、qm-tpl |
| 考え方 | 「CI が全 pass でも orphan tree を検査した結果なので根拠にならない」。two-dot は「削除した」と「まだ取り込んでいない」を区別しない。API の HEAD は eventual consistency で古いことがある。「『無い』と結論する前に、読めているかを確認する」 | 規定あり / qm-s §①、§事前準備 |
| 調査範囲 | PR の HEAD と base の両方 | 規定あり |
| 調査の深さ / 背景不明 | — | 規定なし |
| 矛盾時 | `gh pr view` と `ls-remote` が乖離したら ls-remote を信頼し fetch してから検証。stale な base と比べると false positive / false negative の両方が出る | 規定あり / qm-s §Authoritative HEAD、dp/head |
| 出口条件 | HEAD SHA を固定できた | 一部 |
| 成果物・受け渡し | — | 一部 |

#### Q2 要求照合（手順 1）

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | Q1 完了。PR body の `closes #X` から Issue を開く | 規定あり / qm-s §手順 1 |
| すること | AC 各項目を PR diff と 1 対 1 で突き合わせ、AC 検証マップが全行埋まり結果が実変更と整合しているかを見る。`po-decision:required` の PR は Issue 側の採択条件と PR body の決裁ブリーフの 2 か所を両方読む | 規定あり / qm-s §手順 1、sk/qm §5 |
| 考え方 | 「CI は書いた通りにしたかしか見ない。書いた内容が Issue 意図と合うかは人間しか見られない」。順序固定（CI を最後に見る）は「CI 緑 = approve」退行を防ぐため | 一部 / dp/anti §5、qm-s §手順 4 末尾 |
| 調査範囲 | 横展開（並行実装 8 カテゴリ）/ 設計書同期 / テスト品質は pr-review A〜I と ag/qm の多観点（A〜H）にある | 一部 / sk/review、ag/qm §2 |
| 調査の深さ | — | 規定なし |
| 背景不明 | Issue の目的・AC 自体が曖昧なときの扱いは無い。§0 ルール 5 は「AC は目安、close の判定は顧客に届いたか」 | 規定なし（§0 の原則のみ）|
| 矛盾時 | ずれ・未対応は手順 5 で BLOCK（ただし §0 後は BLOCK 3 類型に該当する場合のみ） | 一部 / qm-s §手順 1、§BLOCK 基準 |
| 出口条件 | 全 AC の突合が済んだ | 一部 |
| 成果物・受け渡し | approve 本文の「手順 1」欄に AC 突合結果 | 規定あり / qm-s §全手順 Pass |

#### Q3 画面の検証（手順 2・3）

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | 差分に `.svelte` / `.css` / `site/**` 等を含む | 規定あり / qm-s §手順 3 |
| すること | PR body の画像を Read で実際に開き、1 枚ごとに最低 1 行の具体所見。`.dom.html` スナップショットの併記を確認。「描画変化なし」主張は diff と照合。UI fix は A〜D 仕分けの妥当性（B〜D を A で済ませていないか、還元先の実装が同 PR にあるか）。UI/UX 10 項目（レイアウト / 文字列 / 読解 / ユーザビリティ / タップ領域 / モバイル / a11y / ダークパターン / デザインシステム / 競合比較）+ 5 年齢モード + 2 ビューポート。画像 0 枚なら BLOCK | 規定あり / qm-s §手順 2-3、ui-chk、webui §5 |
| 考え方 | 「見ていない画像に所見を書かない」。「全観点を毎回文章化する必要はない。気になった点だけ具体的に、ただし無言 approve は不可」。CI の screenshot-check は枚数しか見ない弱いチェックで、妥当性は QM 専権 | 規定あり / qm-s §手順 2-3、ui-chk §報告ルール |
| 調査範囲 | 10 項目 + 年齢モード表 + 390px / 1280px | 規定あり / ui-chk |
| 調査の深さ / 背景不明 | — | 規定なし |
| 矛盾時 | Before / After が同一 sha256 = SS 偽装（撮影時ガードと CI の Blob SHA 検査） | 一部 / qm-s §Before/After |
| 出口条件 | 全画像に所見 | 規定あり |
| 成果物・受け渡し | approve 本文「手順 2」「手順 3」欄 | 規定あり |

#### Q4 CI の判定（手順 4）

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | 手順 1〜3 の後（順序固定） | 規定あり / qm-s §手順 4 |
| すること | `statusCheckRollup` を context 単位に畳んで最新だけを見る jq を**実行**する（読むだけで済ませない）。context 0 件は NOT RUN。緑なら context 総数を同じ base の直近 merge 済み PR と比べる。最終可否は `mergeStateStatus`。Draft は approve しない（required が skipping になる）。軽量レーンは e2e / a11y / storybook / VR の不発火は正常、ただし `unit-test` の skip は例外。重量 e2e 敏感領域に触れる PR は作者のローカル重量 e2e 証跡か並行実装ペア更新の明記を approve 条件に追加。red は CI Fix subagent | 規定あり / qm-s §手順 4、§gh pr checks、§Draft PR、§重量 e2e 敏感領域 |
| 考え方 | 「空集合を緑と読まない」「skipping は走らなかったのであって通ったのではない」「散文の注意書きより同じ場所にあるコマンドの出力を信じる」。並走下の QM 自身のローカル red は単独では BLOCK 根拠にならない | 規定あり / qm-s §gh pr checks、§アーキテクチャ |
| 調査範囲 | レーン別の required 一覧 | 規定あり / qm-s §レーン、branch §4 |
| 調査の深さ | CI 失敗はゼロベースで調べず KB（`docs/troubleshoot/github_actions.md`）→ `--log-failed` | 一部 / qm-s §やってはいけないこと、qm-tpl §CI Fix |
| 背景不明 | — | 規定なし |
| 矛盾時 | 緑に見えるのに `BLOCKED` なら「読み方が間違っている」。再トリガ後の複数世代は最新だけ。cancel された run が出し直されるまで判定しない | 規定あり / qm-s §gh pr checks |
| 出口条件 | ALL GREEN（context 数が妥当）+ CLEAN | 規定あり |
| 成果物・受け渡し | 報告は CI 行の実測を先に | 一部 |

#### Q5 合否判定（手順 5）

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | 手順 1〜4 完了 | 規定あり |
| すること | 直近 7 日の deploy file を PR 自身が削除していないか（three-dot、develop レーンでは develop 上の先行 merge を区別）。BLOCK は 3 類型（顧客に実害 / 証跡の真正性 / 不可逆）のみ。該当しないものは approve + PR コメントの follow-up に降格（降格条件 = 独立に実 diff を見て実害が無いと確認できた場合のみ）。gate の削除・warn 降格は BLOCK 事由にせず「PO 承認があるか」だけ確認。`po-decision:required` を理由に止めない。Dev に返すのは「実装方針の変更」と「BLOCK 3 類型」だけ | 規定あり / qm-s §手順 5、§BLOCK 基準、憲章 §0 ルール 2・3・6、sk/qm §5 |
| 考え方 | ラバースタンプ禁止（指摘が無いなら「レビューが不十分」と疑う）。Dev の self-report（pre-ready `[x]`・完遂宣言）を独立検証なしに信用しない。「BLOCK 3 類型に非該当」は CI 緑を含意しない | 規定あり / dp/anti §4、qm-s §やってはいけないこと |
| 調査範囲 | pr-review A〜I（ファイル存在・依存 / AC / テスト品質 / 横展開 / CSS / 設計書同期 / セキュリティ / 文書化 / 直近 deploy 削除）+ Step 0 の PO 決裁 triage | 一部（§0 後の扱いと食い違い、§8.6）/ sk/review |
| 調査の深さ | — | 規定なし |
| 背景不明 | 判断を仰ぐなら label（不可逆 4 操作 → `needs-owner`、方針 → `needs-po`）。ただし §0 ルール 3 で PO に決裁を求めない | 一部 / qm-s §セッション起動時、憲章 §0 |
| 矛盾時 | 意図的削除か rebase 不足かの切り分け（`git log origin/develop -- <file>`） | 一部 / qm-s §直近 deploy file 削除 |
| 出口条件 | approve か BLOCK（3 類型）か | 規定あり |
| 成果物・受け渡し | BLOCK 時は「手順 N で BLOCK / 指摘内容（根拠 = AC 番号・画像 URL・CI ジョブ名）/ 対応依頼」のコメント + `state:qm-blocked` | 規定あり / qm-s §BLOCK → 指摘コメント |

#### Q6 修正・再レビューループ

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | BLOCK 3 類型に当たらない不備 / CI red / BLOCK 後の修正 push | 規定あり / qm-s §②③ |
| すること | ① レビュー subagent → ② 修正 subagent（Dev に投げない）→ ③ 再レビュー subagent → ④ lead が実測して merge。②③ は同じ agent を使い回してよい（1 PR = 1 agent）。修正 agent には「push 前に自分で検証」「worktree で作業」「`--no-verify` 禁止、止められたら止まったまま報告」を明示。Re-Review は前回 BLOCK の AC ごとに HEAD で確認、静的検査と E2E の両方をローカル実行、Dev の「全件解消」を独立 grep で件数突合 | 規定あり / 憲章 §0 ルール 2、qm-s §②③、§Re-Review、qm-tpl |
| 考え方 | 「1 セッションで複数 PR を処理すると context 肥大化で手順省略・判断ブレ」→ 各 PR を独立 agent。「subagent の報告を成果の根拠にしない」（実例: 削除済みと報告された job は実はその PR が削除していた） | 規定あり / qm-s §アーキテクチャ |
| 調査範囲 | CI Fix の判断表: label 不足 / 生成物同期漏れ / 軽微なテスト失敗 / 型・lint は修正、本質的実装誤り（AC 未達・設計ミス・顧客価値毀損）は修正せず BLOCK | 一部 / qm-tpl §CI Fix subagent 判断基準 |
| 調査の深さ | 未知の CI 失敗は KB に新エントリを追加 | 一部 / qm-tpl |
| 背景不明 | — | 規定なし |
| 矛盾時 | 「同じ指摘で 2 周したら、それは実装方針の問題」→ Dev に返す。3 周目を回さない | 規定あり / 憲章 §0 ルール 2 |
| 出口条件 | 再レビューで BLOCK 3 類型 0、かつ非 pass 行 0 | 規定あり / 憲章 §0 ルール 2 |
| 成果物・受け渡し | subagent の完了報告（手順ごとの Pass / Block + 根拠 1 行、evidence パス）。commit author は承認用アカウント | 規定あり / qm-tpl |

#### Q7 承認・merge・事後

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | Q6 の収束条件。`ready-to-merge` でも緑を確認してから | 規定あり / qm-s §セッション起動時 |
| すること | lead 本体が account switch → approve → `mergeStateStatus` CLEAN 確認 → squash merge → 作成用アカウントに復帰、を不可分ブロックとして実行（subagent に委譲しない）。approve 本文は 5 手順の定型。hotfix は同じ run 内で develop への back-merge まで。サマリー記録（処理 PR / merge 済 / block 中 / 指摘概要）。次 PR 着手前に「verify 済み・approve 未実行」の残置を確認 | 規定あり / qm-s §④、§全手順 Pass |
| 考え方 | 「赤を跨いだ merge は理由が正当でも外形が admin bypass と区別できない」。物理遮断（hook）は外されており、手順はロール定義の遵守で保つ | 一部 / qm-s §全手順 Pass |
| 調査範囲 | — | 一部 |
| 調査の深さ / 背景不明 / 矛盾時 | — | 規定なし |
| 出口条件 | merge 済み + 復帰を verify + （hotfix は back-merge 済み） | 規定あり |
| 成果物・受け渡し | approve コメント（5 手順の所見）、label `ready-to-merge` | 規定あり |

#### Q8 問い合わせ応答

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | `state:needs-qm`（レビュー依頼に限らない） | 規定あり / mailbox §3.1 |
| すること | 用件は本文を読む。回答したら問い合わせ元の state に戻す。実装完了のレビュー依頼なら `dev-done` に読み替え。不可逆 4 操作が絡めば `needs-owner` | 一部（回答の作り方は無い）/ mailbox §3.1.1 |
| 考え方 | 「問い合わせは往復である」 | 一部 |
| 出口条件 / 成果物 | label を戻した / 回答コメント | 規定あり |
| その他の観点 | — | 規定なし |

---

## 3. PO

### 3.1 工程の一覧

PO の定義は「決めるのは 2 つだけ」「決めないもの」の範囲規定が中心で、工程の並びは sk/po の §1〜§8 と issue-triage の 7 ステップしかない。

| # | 本棚卸しの工程名 | 主な出典 |
|---|---|---|
| P0 | 受付・滞留検出（mailbox / ORPHAN / STALE-HOLD / DUP-AXIS / 生存確認） | sk/po §1-4, §8、mailbox §4 PO 用・§5.1 |
| P1 | 決裁前の実測 | po-s §決裁前の実測義務 |
| P2 | 決裁と記録（文言・UX・価格の方針） | po-s §PO が決めるのは 2 つだけ、§PO の決定は GitHub に残す、sk/po §5-6 |
| P3 | backlog の順序（priority / on-hold） | po-s §priority、mailbox §3.2、憲章 §4.1 |
| P4 | Issue 起票 | po-s §Issue を起票する基準、sk/triage 7 ステップ + 手順 A〜F、ag/po §フェーズゲート |
| P5 | close 判定 | po-s §運用行為の AC、憲章 §0 ルール 5 |

### 3.2 工程 × 観点の判定一覧

| 工程 | 入口 | すること | 考え方 | 調査範囲 | 調査の深さ | 背景不明 | 矛盾時 | 出口 | 成果物 |
|---|---|---|---|---|---|---|---|---|---|
| P0 受付 | 規定あり | 規定あり | 規定あり | 規定あり | 規定なし | 規定なし | 一部 | 一部 | 規定あり |
| P1 実測 | 規定あり | 規定あり | 規定あり | 規定あり | 規定なし | 一部 | 一部 | 一部 | 規定なし |
| P2 決裁 | 一部 | 一部 | 一部 | 規定なし | 規定なし | 規定なし | 規定なし | 規定あり | 規定あり |
| P3 順序 | 一部 | 一部 | 一部 | 規定なし | 規定なし | 規定なし | 規定なし | 規定なし | 一部 |
| P4 起票 | 規定あり | 規定あり | 規定あり | 規定あり | 規定あり | 一部 | 一部 | 規定あり | 規定あり |
| P5 close | 一部 | 一部 | 規定あり | 一部 | 規定なし | 規定なし | 規定なし | 規定あり | 一部 |

### 3.3 工程ごとの詳細

#### P0 受付・滞留検出

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | 毎時 cron。拾うのは `needs-po` / `needs-owner` / `ready-to-merge` の CI 実測確認 / ORPHAN / STALE-HOLD / DUP-AXIS（Issue と PR の両方） | 規定あり / po-s §セッション起動時 |
| すること | ORPHAN は PO 必須で確認。backlog を orphan にしない（着手順に入っていないものに `status:on-hold`）。STALE-HOLD は hold を外す。DUP-AXIS は `--remove-label` で片方を外す。「mailbox 空」が 3 回連続したら orphan・各受信箱の件数・直近 merged・EPIC 着手状況から誰かが実際に動いているかを判定 | 規定あり / sk/po §3-4, §8、mailbox §5.1 |
| 考え方 | 「受信箱が空であることは、仕事が無いことではなく渡す経路が壊れていることの兆候である方が多い」。「label は実測を代替しない」 | 規定あり / mailbox §5.1、sk/po §5 |
| 調査範囲 | 上記クエリ群 | 規定あり / mailbox §4 PO 用 |
| 調査の深さ / 背景不明 | — | 規定なし |
| 矛盾時 | 「1 つの軸に 2 つの値は不正」 | 一部 / mailbox §3.2 |
| 出口条件 | 経路が生きていると判定した。壊れていた場合の次の手は「セッション / cron 停止を疑う」まで | 一部 / mailbox §5.1 |
| 成果物・受け渡し | `needs-owner` は不可逆 4 操作のどれかを 1 行で示し、実 diff と影響範囲を添えてオーナーへ | 規定あり / sk/po §5 |

#### P1 決裁前の実測

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | 決裁の対象が「実装が入っているか」「CI が緑か」「label の状態が正しいか」 | 規定あり / po-s §決裁前の実測義務 |
| すること | 報告ではなく実物を 1 回叩く: CI → `statusCheckRollup` を畳む（skipping を pass と数えない）/ 実装 → `gh pr diff`・`git show` / closing keyword → 行として grep / 過去の決定 → `gh issue view --json comments` で決裁履歴全体 | 規定あり / po-s §決裁前の実測義務 |
| 考え方 | 「PO は最終承認者で、下流に是正者がいない」。「整った報告ほど実測を省きたくなる。論理が整っていることと事実がそうであることは別」。「全緑」は検査された範囲とセットでしか意味を持たない | 規定あり |
| 調査範囲 | 上表の 5 種 | 規定あり |
| 調査の深さ | — | 規定なし |
| 背景不明 | 過去に決めたことがあるかを決裁履歴で確認（受容済みの決定を蒸し返さないため） | 一部 |
| 矛盾時 | 報告と実物が違えば実物を採る（明文は「実物を叩いてから決裁」のみ） | 一部 |
| 出口条件 | 叩いた結果が決裁対象を裏付けた | 一部 |
| 成果物 | 実測結果の残し方は規定なし | 規定なし |

#### P2 決裁と記録

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | `needs-po`。ただし PO が決めるのは ①顧客に見える文言・UX・価格の方針 ②backlog の順序だけ。価格・課金の Approver はオーナー | 一部 / po-s、憲章 §4.1 |
| すること | 決定は指示を出した時点で該当 Issue / PR にコメントとして残す。PR body が参照する PO 判断には GitHub 上の出典 URL を付ける。複数 PR に跨る判断は親 Issue のコメント 1 件を SSOT に。決裁したら次の担当の state へ付け替え（判断待ちが 2 件以上残るなら label を移さない） | 一部（どう決めるかは無い）/ po-s §PO の決定は GitHub に残す、sk/po §6 |
| 考え方 | 「出典の無い『PO 承認済み』は主張であって根拠ではない」。決めないもの（着手順・実装方式・merge 可否・装置・release cut・不可逆 4 操作）の表 | 一部 |
| 調査範囲 / 深さ / 背景不明 / 矛盾時 | 文言・UX・価格を決めるときに何を調べるか（顧客調査・競合・法務・LP truth）は issue-triage と ag/po の視点リスト（マーケ / 法務 / 財務 / 仮想顧客）にしか無く、決裁工程には紐付いていない | 規定なし |
| 出口条件 | コメントが GitHub にあり、label が次の担当を指している | 規定あり |
| 成果物・受け渡し | 決裁コメント + state 付け替え | 規定あり |

#### P3 backlog の順序

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | 常時（タイミング規定なし）。`status:*` は PO 軸 | 一部 / mailbox §3.2 |
| すること | priority 4 段（critical = 顧客 / 運営が明確に損害、high = 顧客価値の劣化で運用回避可、medium = 内部改善、low = nice-to-have）。`status:on-hold` を付ける / 外す。着手そのものは管理しない（何を次に取るかは Dev） | 一部 / po-s §priority、憲章 §4.1 注記 |
| 考え方 | 「Ordering は『どれが次に価値が高いか』であって『いつ誰が何本並行でやるか』ではない」。Pre-PMF 3 視点（顧客価値 / 事業推進 / 技術負債）で全部 No なら Low 以下（ag/po） | 一部 / 憲章 §4.1、ag/po §判断フレームワーク |
| 調査範囲 / 深さ / 背景不明 / 矛盾時 / 出口 | 順序付けの手順・頻度・完了条件は無い。憲章 §6 は「Product Backlog が整理されていない」を未解決課題と明記 | 規定なし / 憲章 §6 |
| 成果物 | label のみ | 一部 |

#### P4 Issue 起票

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | Issue にするのは「顧客価値の作業単位（EPIC と傘下の実装単位）」と「オーナーの手番が要るもの」だけ。直せないと分かったときだけ（先に起票しない）。それ以外はその場で PR | 規定あり / 憲章 §0 ルール 7、po-s |
| すること | 7 ステップ: ① 根本原因（5 Whys → root class、同 class 再発なら class 全体を lock する方針）② Pre-PMF 5 質問 + 3 バケット（既定は沈黙）③ マーケ / Growth ④ 法務 ⑤ 財務 ⑥ 仮想顧客 ⑦ テンプレート（背景 / 根本原因 / 解決策 / AC / Pre-PMF / OSS / Alternatives + Prior art / No-gos / UX checklist / research）。補助: A namespace 重複 / B OSS 先調査 / C research 添付 / D `--body-file` / E 機能完成度 checklist 17 項目 / F 同領域 EPIC 6 ヶ月確認 + 3 件目の抽象化判断。認証系は全ログイン手段について AC | 規定あり / sk/triage |
| 考え方 | 「推測を書かない。『おそらく』『〜のはず』で書いた前提を残さない。実測していない事象は『未確認』と明示」（推測前提で着手して diff ゼロの虚偽完了になった実例）。AC は具体的・検証可能、1 Issue = 1 機能 | 規定あり / po-s、ag/po §Issue の品質基準 |
| 調査範囲 | 手順 A〜F、LP / pricing / faq 波及（dp/lateral §2 は Issue 起票時の観点として書かれている） | 規定あり |
| 調査の深さ（いつ deep research するか） | **プロジェクトで唯一の明文の決定木**: 軽量（UI 微修正等）= 1 行の Pyramid Statement + 3 案 / 中規模（新機能・新 OSS）= Issue Tree + Alternatives + Prior art / 大規模（アーキ変更・障害・compliance）= RFC 8 章 + Spike。出力は Issue 本文に 300〜500 字 + 詳細レポート | 規定あり / sk/triage 手順 C |
| 背景不明 | 手順 E・F で「判定不明なら業界 prior art を 3〜5 件調査」「判定不明なら PO に確認してから起票」。PO 確認 4 段階（research scope / prompt / 結果 / 起票前）は「PO 補佐」時代の定義で、PO 自身が起票する現行とは主語が合わない（§8.6） | 一部 / sk/triage 手順 C, E, F |
| 矛盾時 | namespace 衝突時の 3 択（scope 統合 / 命名回避 / 意図的拡張）。過去設計との整合確認（ナビ系は関連 closed Issue / ADR / IA 設計書を全件 grep し、現状 SSOT と提案の差分を明示） | 一部 / sk/triage 手順 A, E |
| 出口条件 | テンプレート全節が埋まった（該当しない節は「N/A」「特になし」と明記） | 規定あり |
| 成果物・受け渡し | `tmp/issue-bodies/` → `gh issue create --body-file` → 削除。詳細レポートは `docs/reference/NN-research-*.md` | 規定あり / sk/triage 手順 C, D |

#### P5 close 判定

| 観点 | 内容 | 判定 / 出典 |
|---|---|---|
| 入口条件 | develop merge 時点で merge 実施者が close + `status:awaiting-release`（PO 固有ではない）。統合 PR の `Closes` 集約が保険 | 一部 / branch §3.2 |
| すること | 「AC は目安。close の判定は顧客に届いたか」。運用行為（実機確認・外部媒体への退避記録等）を含む AC は、関連 PR が全部 merge されても充足しない — 実施記録が Issue に貼られていることが条件。統合 PR の `Closes` 集約にも含めない | 一部 / 憲章 §0 ルール 5、po-s §運用行為の AC |
| 考え方 | 「auto-close すると追跡者が消える」 | 規定あり |
| 調査範囲 | 未チェック AC の数（`grep -c '^- \[ \]'`、監査側の規定） | 一部 / audit-t §3.5.2 |
| 出口条件 | 実施記録が Issue にある | 規定あり |
| その他 | 「顧客に届いたか」を何で確認するかは無い | 規定なし |

---

## 4. Platform（≈ 保守の一部）

### 4.1 工程の一覧

**現在「増やす・良くする」は凍結中**（憲章 §0 ルール 1、2026-08-05〜）。進めてよいのは A（削減）と B（リリースプロセスへの移管）だけ。工程は pf-s §作業の進め方の 6 段が明示されている。

| # | 工程 | 主な出典 |
|---|---|---|
| L0 | 受付と凍結の判定 | pf-s §凍結中、§cron テンプレート |
| L1 | 計測（ベースライン） | pf-s §最初にやるのは計測、§作業の進め方 1 |
| L2 | 消す検討（A / B / C 判定） | 憲章 §0 ルール 1 判定基準、pf-s §作業の進め方 2 |
| L3 | 生成への置き換え | pf-s §作業の進め方 3 |
| L4 | 統合 | pf-s §作業の進め方 4 |
| L5 | 検証（破ったら落ちるか） | pf-s §局所テストコマンド |
| L6 | 受け渡し（方針 → PO、不可逆 → オーナー、PR → QM） | pf-s §作業の進め方 5-6、§判断を仰ぐときの label |

### 4.2 工程 × 観点の判定一覧

| 工程 | 入口 | すること | 考え方 | 調査範囲 | 調査の深さ | 背景不明 | 矛盾時 | 出口 | 成果物 |
|---|---|---|---|---|---|---|---|---|---|
| L0 受付 | 規定あり | 規定あり | 規定あり | 規定あり | 規定なし | 規定なし | 一部 | 一部 | 規定あり |
| L1 計測 | 規定あり | 規定あり | 規定あり | 一部 | 規定なし | 規定なし | 規定なし | 規定なし | 一部 |
| L2 消す検討 | 一部 | 規定あり | 規定あり | 一部 | 規定なし | 規定なし | 規定なし | 一部 | 一部 |
| L3 生成 | 一部 | 一部 | 規定あり | 規定なし | 規定なし | 規定なし | 規定なし | 規定なし | 規定なし |
| L4 統合 | 一部 | 一部 | 一部 | 規定なし | 規定なし | 規定なし | 規定なし | 規定なし | 一部 |
| L5 検証 | 一部 | 規定あり | 規定あり | 一部 | 規定なし | 規定なし | 規定なし | 一部 | 一部 |
| L6 受け渡し | 規定あり | 規定あり | 一部 | 規定なし | 規定なし | 一部 | 一部 | 規定あり | 規定あり |

### 4.3 工程ごとの詳細

| 工程 | 主な内容 | 出典 |
|---|---|---|
| L0 受付と凍結の判定 | 拾うのは `needs-platform`。「増やす / 直す」は Platform の仕事ではない（既存分は `status:on-hold`）。例外は「顧客の金かデータに**現に**届いている装置不具合」だけで、判定は QM。再開トリガーは特定の課金フローが staging で 1 周した時点。ORPHAN 検出は PO / Dev が担うので重複させない | pf-s §凍結中、§cron テンプレート |
| L1 計測 | 「Platform の最初の仕事は装置を削ることではなく、削る前の値を測ること」。成功指標 = Dev の手戻り（QM 差し戻し件数 / pre-ready の落ち回数 / PR 往復回数）。既存データ（label 履歴・CI run・review 回数）から取り、**新しい計測装置を先に作らない**。測り方と初期値は Issue に残す（セッション上の数字は証跡にならない）。【観点の欠け】どの期間・何件を測れば十分かは無い。憲章 §6 は「まだ測っていない」と明記 | pf-s §顧客は Dev、憲章 §6 |
| L2 消す検討 | 「消して困るのは誰か / どの BLOCK 3 類型を守っているかを 1 行で書く。守っていないなら消す候補」。判定基準: A 削減 = 80 点に達したあとの 20 点しか詰めない検査（書式・表記ゆれ・網羅性・念のため）/ B 移管 = 統合レーンで実行すれば顧客流出を防げる検査 / C 維持 = 顧客の金・データ・法務に直結し PR 単位でしか判定できない。ratchet が縛るのは新しい検査の追加だけで、置換・統合は増加に当たらない | 憲章 §0、pf-s §作業の進め方 2、§3 つの制約 |
| L3 生成 | 人が思い出して満たすものをテンプレート・skill・自動生成に埋め込む（先例 `dev:open-pr`）。考え方は「governance stops being a gate and becomes a property of the path」（golden path / paved road）。どう設計するかの手順は無い | pf-s §作業の進め方 3、憲章 §2 原則 3 |
| L4 統合 | 同じ観点の検査を 1 本にまとめ、失敗メッセージに「次にやること」を書く | pf-s §作業の進め方 4 |
| L5 検証 | script を変えたら実際に叩いて exit code と出力を見る。検査 script は「破ったときに落ちること」が本体なので、意図的に違反を作って fail するかを見る。pre-ready 全 step PASS | pf-s §局所テストコマンド |
| L6 受け渡し | gate / guard / test を残すか消すかの**方針** → `needs-po`（実行は通常の PR + QM レビュー、オーナー決裁ではない）。本番データ削除 / 本番 deploy / 課金書込 / スキーマ変更 → `needs-owner`。完了したら `dev-done` で QM へ（自分で approve しない）。やってはいけない: 方針を自分で決める / 製品コード / release cut / 新しい検査を足すときに既存を減らさない / 装置を守る装置（無限後退）/ assertion 弱体化 / Pre-PMF に見合わない基盤 | pf-s §判断を仰ぐときの label、§やってはいけないこと |

**背景不明・矛盾時**: Platform 向けの明文は無い。手掛かりは「迷ったら止めて渡す」（憲章 §2 原則 5）と、装置の class-lock を作らない理由（「装置を守る装置」は無限後退、mailbox §3.1.1）だけ。

### 4.4 保守（maintenance）として Platform・監査・QM に散っているもの

| 保守の対象 | 担当 | 書かれている内容 | 判定 / 出典 |
|---|---|---|---|
| 開発基盤（検査 script・workflow・テンプレート・CLAUDE.md） | Platform | 上記 L0〜L6（凍結中） | 規定あり / pf-s |
| 依存更新 | QM | Dependabot PR は下位互換性なしも採用方針、コード修正が要るならその場で修正 PR、overlap 警告は無視可 | 一部 / qm-s §Dependabot |
| deps の供給線 | 監査 | deps diff を「前回 deploy 済み main commit」基準で取る、native dep bump の重点監視、main 直行 bump 残骸の検出 | 規定あり / audit-t §3.5.1 |
| 本番の健全性 | 監査 | deploy 後に AWS 版・NUC 版両方の health check（deploy-verify skill） | 規定あり / audit-t §3.8 step 9 |
| 環境（クローン・Node 版） | 規定なし（clone-setup は手順書） | Node 版の SSOT・`npm ci` 2 段・major 切替時の再ビルド・躓いたら §5 に 1 行足す | 一部 / clone §2-6 |
| docs の定期棚卸 | **担当ロールなし** | ADR 月 1 棚卸（チェック項目・出力先あり）、codebase-map 4 半期 retrospective | 一部（誰がやるか規定なし）/ docs-c §ADR 月 1 棚卸、codebase-map §9 |
| 製品コードの技術負債の返済 | **担当ロールなし** | Dev の「実装モダン性の継続検証」（触れたコードとその周辺だけ）以外に、計画的な返済工程は無い | 規定なし / dev-s §実装モダン性 |

---

## 5. 監査（≈ 保守の一部 + リリース）

### 5.1 工程の一覧

audit-t §3.8 の 9 ステップが明示されている。「step 番号は依存関係であって実行順ではない」（依存が無いものは並列に起動してよい、特に cut 直後の CI 待ちと領域監査）。

| # | 工程 | 対応する step / 節 |
|---|---|---|
| A0 | 受付 | audit-t §0、mailbox §4 監査用 |
| A1 | 事前準備ゲート | §3.7（5 項目） |
| A2 | 差分整理と起動領域の決定 | step 1、§3.1.1、§3.5.1 |
| A3 | テスト範囲の洗い出しと deep research | step 2-3 |
| A4 | テスト追加と develop への PR | step 4-5 |
| A5 | release cut と統合 PR 発行 | step 6、§3.5.2 |
| A6 | 領域監査（全件発露）と CUJ 横断 deep research | §3.1、§3.6 [1]、ag/audit §A, §D |
| A7 | filter と起票 / 棄却 | §3.6 [2]-[5b]、sk/policy、ag/audit §E |
| A8 | CI fail の全件 triage | step 7 |
| A9 | merge 判定 | §3.5、§3.8.1、step 8、ag/audit §F |
| A10 | deploy 後の確認と back-merge | step 8-9 |
| A11 | 非 critical PR のサンプリング監査 | §3.9 |

### 5.2 工程 × 観点の判定一覧

| 工程 | 入口 | すること | 考え方 | 調査範囲 | 調査の深さ | 背景不明 | 矛盾時 | 出口 | 成果物 |
|---|---|---|---|---|---|---|---|---|---|
| A0 受付 | 規定あり | 規定あり | 一部 | 規定あり | 規定なし | 規定なし | 規定なし | 一部 | 一部 |
| A1 事前準備 | 規定あり | 規定あり | 一部 | 規定あり | 規定なし | 規定なし | 一部 | 規定あり | 規定あり |
| A2 差分整理 | 一部 | 規定あり | 規定あり | 規定あり | 規定なし | 規定なし | 規定なし | 一部 | 一部 |
| A3 テスト範囲 | 一部 | 一部 | 一部 | 一部 | 一部 | 規定なし | 規定なし | 規定なし | 規定なし |
| A4 テスト追加 | 一部 | 一部 | 一部 | 一部 | 規定なし | 規定なし | 規定なし | 一部 | 一部 |
| A5 cut | 規定あり | 規定あり | 規定あり | 一部 | 規定なし | 規定なし | 規定あり | 一部 | 規定あり |
| A6 領域監査 | 規定あり | 規定あり | 規定あり | 規定あり | 規定あり | 規定なし | 一部 | 一部 | 規定あり |
| A7 filter | 規定あり | 規定あり | 規定あり | 規定あり | 規定なし | 規定あり | 規定あり | 規定あり | 規定あり |
| A8 CI triage | 規定あり | 規定あり | 規定あり | 一部 | 一部 | 規定なし | 規定あり | 一部 | 一部 |
| A9 merge 判定 | 規定あり | 規定あり | 規定あり | 規定あり | 規定なし | 規定なし | 規定あり | 規定あり | 規定あり |
| A10 事後 | 規定あり | 規定あり | 一部 | 規定あり | 規定なし | 規定なし | 規定なし | 一部 | 一部 |
| A11 抽出監査 | 規定あり | 規定あり | 規定あり | 一部 | 規定なし | 規定なし | 一部 | 一部 | 規定あり |

### 5.3 工程ごとの詳細

| 工程 | 主な内容 | 判定の要点 / 出典 |
|---|---|---|
| A0 受付 | 拾うのは `needs-audit`（cut 依頼に限らず問い合わせ含む）/ `release/* → main` の open PR / `main..develop` の commit 数。50 commits を超えたら PO に cut を提案（develop が動き続けて凍結できず 4 日実査不能で棄却された実例）。label を cut の自動起動として扱わない。per-PR の AC は再判定しない | audit-t §0 |
| A1 事前準備ゲート | 5 項目（ブランチ戦略の cutover / staging 環境 / 統合 PR 発行準備 / 統合レーンの CI / 実機 e2e のマイグレ込み起動）。未整備項目は最初の finding として扱い無視して run を始めない。実施不能な領域は「実施不能」と明記（無言 skip しない）。揃うまでは部分 run | 規定あり / audit-t §3.7 |
| A2 差分整理と起動領域 | 含有 feature / fix を一覧化。**起動領域は変更 path の集合から機械的に導く**（docs のみ / CI 系 / UI / server・domain / infra / package / site の 7 行の対応表）。常時起動 = 技術調査・問題起票・ポリシー準拠判定。「迷ったら起動する側に倒す。削るのは差分がゼロの領域だけ」。未起動の領域は判定エビデンス表に「差分なしのため未起動」と明記（書かないと「見たが問題なし」と区別できない）。deps は前回 deploy 済み commit 基準 | 規定あり / audit-t §3.1.1, §3.5.1 |
| A3 テスト範囲と deep research | step 2 = 影響領域 × テスト種別の洗い出し、step 3 = 範囲・方針・影響範囲見積もりを deep research して抜け漏れ確認。**deep research の方法・打ち切り条件は無い**（技術調査は impact-analysis / regression-check を再利用、§3.2） | 一部 / audit-t §3.8 step 2-3, §3.2 |
| A4 テスト追加 | develop の既存テストとの網羅性マッピングで冗長を排除。監査が足すのは「統合状態でしか検出できない CUJ 横断テスト」だけ。追加テストは develop へ PR | 一部 / audit-t §3.8 step 4-5 |
| A5 cut と統合 PR | develop の特定 commit を凍結して `release/<YYYY-MM-DD>` を cut → 統合 PR（frozen 標的、force-push 禁止 ruleset）。集約 `Closes #N` に足す前に Issue の未チェック AC を実測、運用行為を含む AC と唯一の open tracker は集約しない。下書きの「書いたつもり」を避けるため、下書きと実 body の close 宣言を照合（grep で代替しない） | 規定あり / audit-t §3.8 step 6, §3.5.2、branch §3.1 |
| A6 領域監査 | 8 チーム（競合 / 技術 / プロダクト実装 / ユーザビリティ・a11y / セキュリティ / パフォーマンス / テスト品質 / 問題起票）+ ポリシー準拠判定を dispatch し、finding を structured JSON で全件出す（この時点で棄却しない、固定時間 box）。Tier1 = 領域別の機械収集、Tier2 = audit-manager の横断統合判定。audit-manager は CUJ 横断テーマ（複数領域に同一原因で跨る finding 群）を自ら deep research し、一次情報 URL 付きで 1 件以上 evidence 化。幻覚抑制: URL 無しの主張は finding にしない / 読んでいない URL を引用しない / 「業界では一般的」等の出典なき一般論を根拠にしない。teammate 同士で互いの仮説を反証させる（competing hypotheses、anchoring 対策） | 規定あり / audit-t §3.1, §3.6, §0.1、ag/audit §A-§D |
| A7 filter と起票 / 棄却 | [2] 重複統合 → [3] severity（1-2 = accepted-residual として統合 PR 本文に記録、3-4 = 次へ）→ [4] ポリシー準拠判定（意図的設計の SSOT 探索 → Pre-PMF 判定 → ブランド禁忌 → 判定不能は `needs_po_review`。`true` 判定には 1 回の反証「そのポリシーは今も妥当か」を必須記録、pointer 無しの `true` 禁止）→ [5] blocking / class-lock 対象（同 root class 2 回目は instance Issue でなく class 全体を 1 件の guard で lock）/ accepted-residual。severity 3 以上は residual 化禁止。棄却は理由を記録（無言棄却しない） | 規定あり / audit-t §3.6、sk/policy |
| A8 CI fail の全件 triage | 「1 件で止めず全件洗い出し、各々 deep research で真因・なぜなぜ・横展開まで」。修正は release branch への append。approve 後に append したら adversarial evidence を再生成して再 approve（approve HEAD = merge HEAD） | 規定あり / audit-t §3.8 step 7 |
| A9 merge 判定 | 必須エビデンス: 新機能・修正一覧 / 対応テストケース / テスト結果表 / カバレッジ / 未解決 NG 0 件 / CodeQL の新規 alert が baseline を超えない（検査不能は pass に倒さない）。adversarial-reviewer を dispatch（3 軸 = business / UX / security で反対理由を必ず 3 件、各 100 文字以上、「反対理由なし」経路は schema で閉じる）。**3 禁則**: ① 時刻・環境が変わって緑になったことを修正の証拠にしない（失敗条件を再現した状態の緑だけが根拠）② gate を直す PR をその gate に検査されないまま merge しない ③ 自分が append した修正を独立検証なしに自分で承認しない。merge は merge commit（squash 禁止） | 規定あり / audit-t §3.5, §3.8.1、ag/audit §F、sk/adv |
| A10 事後 | 本番 deploy を watch → main → develop back-merge → AWS / NUC 両方の health check | 規定あり / audit-t §3.8 step 8-9 |
| A11 抽出監査 | 非 critical PR から 1〜2 件を無作為抽出して PO に 5 分で読める要約を提示し PO が直接レビュー。PO と AI の判定の一致 / 不一致を記録し、**高一致の継続を complacency の兆候として扱う**（抽出件数を増やす / triage を見直す） | 規定あり / audit-t §3.9 |

**背景不明**: 監査で「この変更の意図が分からない」ときの扱いは無い。近いのはポリシー準拠判定の「判定不能は無理に二値化せず `needs_po_review`」だけ（A7）。

**矛盾時**: 「記述と実装の乖離」はプロダクト実装調査チームの対象（docs のみの差分でも起動、§3.1.1）。ポリシーが現状と乖離していれば `needs_po_review` に格下げ（sk/policy の adversarial check）。二重判定の回避（QM が確定した per-PR AC を再判定しない）。

---

## 6. 全工程に掛かる横断規則

| # | 規則 | 要点 | 出典 | タグ |
|---|---|---|---|---|
| X1 | 現行モードの優先 | §0 が §1 以降に勝つ。目標は 100 点ではなく 80 点、残り 20 点を詰める装置は持たない | 憲章 §0 | G |
| X2 | 決定権で境界を引く | 「誰がやるか」ではなく「誰が決めるか」（DACI、1 決定に Approver 1 人） | 憲章 §2 原則 1, §4 | G |
| X3 | 不可逆操作はオーナー | 本番データ削除 / 本番 deploy / 課金書込 / スキーマ変更。気づいた人が誰でも上げる。「職掌ではない」ではなく「この操作が含まれる」で判定 | 憲章 §4.4 | G（4 操作の中身は P） |
| X4 | 作成者 ≠ 承認者 | アカウントを分ける。teammate は lead の認証で動くのでロールを跨いだ team を組まない | 憲章 §3.3、teams §3.1 | G |
| X5 | 受け渡しは label だけ | mention / コメント / PR body は通知経路ではない。外すときは必ず次を付ける。古い state を外してから付ける。復路（対応後に戻す先）を遷移表で固定。経路マトリクスの空欄は経路の欠落 | mailbox §3.1-§3.3.1, §5 | G（label 名は P） |
| X6 | Issue を介さない | 気づき → PR の 2 段。Issue は顧客価値の作業単位とオーナー手番だけ。直せないと分かったときだけ起票 | 憲章 §0 ルール 7-8 | G |
| X7 | 迷ったら止めて渡す | 自分の職掌か判断できないものを進めない | 憲章 §2 原則 5 | G |
| X8 | 報告は実測を先に | 結論より先に実測（CI 行）を書く。label は実測を代替しない。subagent / teammate の報告を成果の根拠にしない（lead が diff と CI を見る） | qm-s、mailbox §2、teams §4.3 ⑧⑨ | G |
| X9 | skip は pass ではない | `gh pr checks` は走った check しか出さない。空集合を緑と読まない。Draft では required が skipping | qm-s §gh pr checks、branch §4.1 | G（jq は P） |
| X10 | 完遂原則 | やりきり = 申し送りを残さない（1 PR で完遂の意味ではない）/ 全 AC を Dev が代替手段で完遂 / 困難時は fix-forward / はりぼて禁止 / Done = 文字通り達成を証跡で確認 / スクラップ & ビルドで互換層を残さない / 前工程の不備は元フェーズを再オープン | dp/complete §1-7 | G |
| X11 | アンチパターン | scope 外の言い訳 / 越境 / assertion 弱体化 / ラバースタンプ / CI は gate ではない / CI 前 Ready / 他人のせいの CI 失敗の放置 / 自律 merge / 段階的リリース / 対症療法の放置 / 複雑度の主語はユーザ / 共通化は実体共通化 | dp/anti §1-12 | G（例は A） |
| X12 | 調査規律 | 正しい問い（自プロダクトの前提から）→ 仮説中立の framing → 反証 3 件 | dp/research | G |
| X13 | 横展開 | 用語・ラベルは grep 全件 / 機能変更は LP・pricing・faq 波及 / DB schema は SSOT 群同期 / レビュアも自分で grep | dp/lateral | G（対象パスは A） |
| X14 | 影響範囲 4 layer | 構文 / 意味 / 構造 / 派生 artifact 22 カテゴリ。grep 単独の完了宣言を禁止 | sk/impact | G（ツール名は P） |
| X15 | OSS 先調査 | 10 行超の独自実装前に 2 件以上比較、無ければ「探した範囲」を書く | sk/triage 手順 B、docs/decisions/README | G |
| X16 | 一般化（A〜D） | 指摘を画面固有 / コンポーネント / アルゴリズム / ガイドライン欠落に仕分け、B〜D を A で済ませない | webui §4、dev-s | G（還元先は A） |
| X17 | same-class-N→guard と例外 | 同 class 2 回目は class 全体を lock。ただし装置自身の不具合には適用しない（装置を守る装置の無限後退） | sk/triage ステップ 1、audit-t §3.6、mailbox §3.1.1 | G |
| X18 | 並行実行 | セッションは 1 本ではない。重い検証はマシン全体で 1 本の lock、止められたら待たずに別作業、CI で代替できるならローカルを諦める。並走結果は根拠に使えない | concur §1-4、dev-s §並行セッション前提 | G（lock 実装は A） |
| X19 | Agent Teams | ロール内だけで組む / 重い検証の並列化に使わない / 書き込む teammate に worktree / 不可逆に触れうるなら plan approval / 成果物はファイルに残させる / 完了は lead が確認 / 空振り 2 回で引き取る / トークン逼迫時は使わない / read-only 分担の 5 条件 | teams §3-§4 | G |
| X20 | 並列 Agent の作法 | worktree 分離、worktree では先に依存 install、「push 済」は remote SHA で verify、stacked PR を使わない | dp/parallel | G（コマンドは P） |
| X21 | docs SSOT | 設計書は「現状の正解」だけ。経緯は git / rationale。会話で決まった仕様は設計書へ。設計書同期は Done 条件 | docs-c §設計書更新ルール, §docs SSOT 原則 | G |
| X22 | Pre-PMF の判断 | 3 バケット（既定は沈黙）、過剰防衛の禁止 | sk/triage ステップ 2、root | G（KPI 値は P） |
| X23 | 推測を書かない | 実測していない事象は「未確認」と明示 | po-s | G |
| X24 | step 番号は依存関係 | 番号は実行順ではなく依存。依存の無いものは並列に起動 | audit-t §3.8 | G |

---

## 7. 汎用 / 値 / 固有の仕分け（主な項目）

工程の要素ごとに G / P / A を付けた。§6 の横断規則のタグも参照。

| 項目 | タグ | 備考 |
|---|---|---|
| mailbox の仕組み（宛先 label と工程 label の分離、復路の遷移表、経路マトリクス、orphan 検出、「空」3 回で生存確認） | G | label 名・cron の分・jq は P |
| 決定権表（DACI）と §0 の「PO が決めるのは 2 つだけ」 | G | 個々の行（新テーブル等は PO）は P |
| 不可逆 4 操作 | G | 中身（本番 NUC / Stripe / DB migration）は P |
| QM 5 手順の順序（CI を最後に見る）と BLOCK 3 類型 | G | |
| subagent ループ（レビュー → 修正 → 再レビュー → lead 実測）と「同じ指摘で 2 周したら方針の問題」 | G | |
| CI 判定の作法（rollup 畳み込み・空集合・skipping・Draft・mergeStateStatus） | G | GitHub Actions 前提なので「GitHub を使うなら G」 |
| authoritative HEAD・three-dot・merge-base で orphan 検出・base を API から読む | G | |
| 直近 deploy file の削除検出 | P | script は A |
| SS 4 スロット・Before/After 同一検出・DOM スナップショット | P | UI のある製品なら汎用、具体は A |
| UI/UX 10 項目 + 5 年齢モード | P / A | 年齢モードは A |
| A〜D 一般化フロー・4 層自動化モデル | G | ツール（axe / pixelmatch / Ark UI）は P |
| 重量 e2e 敏感領域 | A | 「軽量レーン緑 = 安全と誤認しない」の考え方は G |
| develop 二層・gate 二層・release cut の frozen 標的・merge commit | G | workflow 一覧（32 本）は A |
| 完遂原則・アンチパターン・調査規律 | G | 例示は A |
| impact-analysis の 3 分類 + 4 layer + 22 カテゴリ | G | ツール stack は P、事例番号は A |
| issue-triage の 7 ステップ・deep research 規模の決定木 | G | Pre-PMF 5 質問の KPI 値・ペルソナは P |
| 機能完成度 checklist 17 項目（permission / marketplace / 子供向け / ナビ） | P / A | permission 系 5 項目は G に近い |
| 監査の全件発露 → 3 段 filter → accepted-residual / class-lock | G | |
| 起動領域を変更 path から機械的に導く表 | G | path は P |
| ポリシー準拠判定（意図的設計の SSOT 探索 + 反証の強制） | G | 参照する ADR は A |
| adversarial-reviewer（3 軸 × 100 字、反対理由ゼロ経路を schema で閉じる） | G | 軸の名前（business / UX / security）は P |
| 監査の 3 禁則 | G | |
| 抽出監査と complacency 指標 | G | |
| Platform の 3 制約（ratchet / 消す・生成する / 指標は手戻り）と「最初に計測」 | G | |
| hotfix runbook（env 4 経路・env 直参照禁止） | A | 「緊急時こそ gate を回す」は G |
| pre-ready の step 構成・PR body 必須セクション・禁止語 | A | 「Ready 前に機械検査を一括」は G |
| clone-setup（Node 版・`npm ci` 2 段・better-sqlite3） | A | 「新規クローンだけが踏む問題を書き残す」は G |
| heavy lock の実装（Buzz・hook・lock ファイルの検証） | A | 「並走結果は根拠にならない」「判定できないときは通さない（fail closed）」は G |
| QM fix パターン集 | A | 「merge 前に QM が足した fix commit を読んで学ぶ」習慣は G |
| モデル割当（Opus / Sonnet）の判定基準 | G | 合格条件「CI が落ちたところから自力で緑に戻せるか」は汎用 |

---

## 8. 欠けている所（オーナーの期待粒度との差）

### 8.1 Dev

| 欠け | 内容 |
|---|---|
| 工程の 1 本化 | 調査 → 設計 → テスト設計 → テスト実装 → 実装 → テスト評価 → 手戻り の並びが無い。4 か所（dev-s 2 節・ag/dev・sk/dev）に別々の並びがあり、順序も一致しない（ag/dev は「実装 + テスト」を 1 段にしている） |
| 調査の深さ | Dev 向けの「いつ deep research するか」の決定木が無い。30 分 / 2 件 / 一次ソース 2 件 の散発的な数値だけ。issue-triage の規模判定（軽量 / 中規模 / 大規模）を Dev に流用する定めも無い |
| 調査の打ち切り | 「どこまで調べたら十分か」が impact-analysis の checklist 以外に無い |
| 背景・目的が不明なとき | 「Issue にコメント」だけで、それはコメントが通知経路ではないという mailbox の規則と矛盾する。止めるか / 仮定を置いて進めるか / 誰に何を聞くかの判断基準が無い。§0 で PO の決裁範囲が 2 つに絞られたため、目的の確認を PO に上げてよいかも曖昧 |
| 文書と実装の矛盾 | 「設計書が実装の SSOT」と「後工程で前工程の不備を見つけたら元フェーズ再オープン」はあるが、**設計書と現行コードが食い違っているのを見つけたときにどちらを正として直すか**（設計書を直すのか、コードを直すのか、誰に聞くのか）の手順が無い |
| テスト設計 | 入口・出口・成果物が薄い。境界値 / 異常系 / 競合の観点は QM のレビュー観点にあるだけで、Dev がテストケースを設計する手順としては書かれていない。AC が検証可能な形にならないときの扱いも無い |
| テスト評価 | 「テスト結果をどう解釈するか」（flake の切り分け・再実行の扱い）は監査の禁則 ① にあるが Dev には無い |
| 考え方の層 | 各工程の「なぜそうするか」は事故番号（#NNNN）で説明されていることが多く、事故を知らない読み手には原理が伝わりにくい [推論] |

### 8.2 QM

| 欠け | 内容 |
|---|---|
| 調査の深さ | どの PR を深く見るか（リスクに応じた濃淡）の規定が無い。po-decision triage のパス表と重量 e2e 敏感領域が近いが、レビューの深さとは結び付いていない |
| 背景不明 | Issue の目的や AC 自体が不明確なときのレビュー方針が無い（§0 の「AC は目安」だけ） |
| 文書の矛盾 | PR が設計書と食い違う場合、設計書同期なしは「マージ不可」（pr-review F / ag/qm）だが、§0 では BLOCK 3 類型に当たらなければ QM が自分で直す。どちらで扱うかが明示されていない（§8.6） |
| 問い合わせ応答 | `needs-qm` への回答の作り方・期限が無い |
| レビューの出口 | 「指摘ゼロなら不十分と疑う」と「軽微は自分で直して merge」の両立のさせ方（何件見たら十分か）が無い |

### 8.3 PO

| 欠け | 内容 |
|---|---|
| 決裁工程の中身 | 文言・UX・価格の方針を決めるときの判断材料・調査範囲・基準が無い（issue-triage の視点リストは起票用で、決裁に紐付いていない） |
| backlog 順序付け | 手順・頻度・完了条件が無い。憲章 §6 自身が未解決課題として明記 |
| close 判定 | 「顧客に届いたか」を何で確認するか（本番の実測・ログ・実機）が無い |
| 起票の位置づけ | issue-triage は「PO 補佐」時代の書き方（PO 確認 4 段階）のままで、§0 の「Issue にしない」方向とも重みが合わない |

### 8.4 Platform（保守）

| 欠け | 内容 |
|---|---|
| 計測の設計 | 何を・どの期間・何件測れば判断できるかが無い（憲章 §6 で未計測と明記） |
| 生成への置き換え | 手順・設計の考え方・出口条件が無い |
| 背景不明 / 矛盾時 | 装置の存在理由が分からないとき（誰が何のために入れたか）の調べ方が無い。「消して困るのは誰か」を 1 行で書くことだけ |
| 保守全般 | 製品コードの技術負債返済・docs の定期棚卸・依存更新を誰がどの工程で扱うかが分散または未割当（§4.4） |
| 凍結の影響 | 「増やす / 直す」の手順は凍結解除後に使う扱いで、現行の Platform 工程は実質 A / B（削減・移管）だけ |

### 8.5 監査

| 欠け | 内容 |
|---|---|
| step 2-4 | テスト範囲の洗い出し・deep research・テスト追加の方法・打ち切り条件が薄い（「deep research して抜け漏れを確認」の一文） |
| 背景不明 | 変更の意図が分からないときの扱いが無い |
| finding の扱い | §0 ルール 8（finding は統合 PR のコメント、Issue に積まない）と audit-t §3.6 / §3.8 step 7（Issue 起票）が並存（§8.6） |

### 8.6 文書どうしの食い違い（観察した範囲）

§0（2026-08-05）の運用モード変更に追随していない記述が多い。汎用化するときは「どの文書が現行か」をまず決める必要がある。

| # | 食い違い | 一方 | 他方 |
|---|---|---|---|
| C1 | pre-ready の step 数 | ag/dev §検証「全 10 Step」 | dev-s / root / sk/openpr「全 6 step」 |
| C2 | rebase の基点 | ag/dev §Ready 化前 5 項目、sk/review I「origin/main」 | sk/openpr §5・branch §3「develop（hotfix のみ main）」 |
| C3 | Dev の Issue 起票 | ag/dev「PO の判断なく Issue を起票・close しない」 | 憲章 §0 ルール 7・dev-s §役割境界「Dev も可」 |
| C4 | QM の差し戻し | ag/qm §3「設計判断に関わる修正は Dev に差し戻し」§4「1 つでも NG → Request Changes」「設計書同期なき PR はマージ不可」 | 憲章 §0 ルール 2・6、qm-s §BLOCK 基準（3 類型のみ、それ以外は QM が直す） |
| C5 | Dev ブランチへの直接 push | dp/anti §2「Dev PR への直接 push 禁止」 | 憲章 §0 ルール 2（QM が Dev の PR ブランチに push して直す） |
| C6 | adversarial evidence の位置づけ | sk/qm §6「approve の直前に生成して物理 verify（TTL 30 分）」、audit-t §3.8 / sk/audit §4（TTL 30 分を前提） | qm-s §④・sk/adv「merge の前提条件ではない」「TTL の縛りは無くなった」（ADR-0068） |
| C7 | po-decision:required | sk/review 0-3・sk/openpr「PO の Yes/No を得てから merge」 | 憲章 §0 ルール 3「PO に決裁を求めない、merge を止めない」 |
| C8 | PO の決裁範囲 | 憲章 §4.2「新テーブル / 新 interface / セキュリティ / 課金 / AWS / 3 人日以上は Approver = PO」、dev-s §設計ポリシー先行確認 | 憲章 §0 ルール 4・mailbox `needs-po`「PO が決めるのは 2 つだけ、それ以外は付けない」 |
| C9 | 困難時の PO 承認 | dp/complete §3「close & restart は PO 明示承認なしに実行しない」§4「妥協が発生する場合は PO に明示質問」 | 憲章 §0 ルール 4 |
| C10 | gate / test の削除 | ag/pf「gate / guard / test の削除は不可逆 4 操作 = オーナー」 | 憲章 §4.4・pf-s「4 操作に含まれない。方針は PO、実行は通常の PR」 |
| C11 | 監査 finding の行き先 | audit-t §3.6・§3.8 step 7・ag/audit §E「Issue 起票」、severity 1-2 は「backlog 蓄積」（ag/audit） | 憲章 §0 ルール 8「Issue に積まない、統合 PR のコメント」、audit-t §3.6「accepted-residual は PR 本文に記録」 |
| C12 | AC 検証マップ 4 列 | sk/openpr §AC 検証マップ「4 列固定、`ac-map-incomplete` で exit 1」、ag/dev | 同じ sk/openpr §ステップ 3「4 列検証は無い（#4612 で削除）」 |
| C13 | PR 必須セクション数 | 7（sk/openpr 冒頭）/ 12（ready-gate）/ 13（dev-s・dp/qmfix） | — 数がファイルごとに違う |
| C14 | 目的不明時の確認 | dev-s §新規実装時「Issue にコメント確認」 | mailbox §3.1.2「コメントは通知経路ではない」 |
| C15 | PO の主語 | ag/po「Issue 起票・優先度付け・ロードマップ判断の最終責任者」、sk/triage「PO 補佐」「PO 確認 4 段階」 | 憲章 §0 ルール 4・7 |
| C16 | regression-check の差分基点 | sk/regress「`main...HEAD`」 | develop 二層 |
| C17 | ローカルでの全テスト | ag/dev §コミット前チェック「`npx playwright test` 全通過」 | branch §4.1・concur「フルスイートは CI を正とする（並走で偽の red）」 |
| C18 | LP の活動数閾値 | dp/lateral §2「presetActivityCountClaimedMin 300」 | docs-c「120 以上」 |
| C19 | QM のマージ可否 5 条件 | ag/qm「CI 全緑（biome + svelte-check + vitest + playwright）」 | qm-s（軽量レーンでは e2e の不発火は正常） |
| C20 | Issue close の運用 | ag/dev §やってはいけない「PO の判断なく close しない」 | branch §3.2「develop merge 時に merge 実施者が close」 |

---

## 9. 量と汎用化できる割合

行数は `wc -l` の実測。「G の割合」は本棚卸しの読みによる概算 **[推論]**（行単位で数えたものではない）。

| ファイル | 行数 | G の割合（概算） | G 相当行 |
|---|---:|---:|---:|
| `docs/sessions/README.md` | 394 | 70% | 275 |
| `docs/sessions/dev-session.md` | 529 | 35% | 185 |
| `docs/sessions/qm-session.md` | 433 | 50% | 216 |
| `docs/sessions/po-session.md` | 115 | 70% | 80 |
| `docs/sessions/platform-session.md` | 185 | 70% | 129 |
| `docs/sessions/audit-team.md` | 364 | 55% | 200 |
| `docs/sessions/label-mailbox.md` | 373 | 70% | 261 |
| `docs/sessions/branch-strategy.md` | 338 | 30% | 101 |
| `docs/sessions/agent-teams.md` | 235 | 80% | 188 |
| `docs/sessions/agent-concurrency.md` | 132 | 50% | 66 |
| `docs/sessions/clone-setup.md` | 132 | 30% | 39 |
| `docs/sessions/qm-agent-templates.md` | 121 | 60% | 72 |
| `docs/sessions/qm-checklist-ui-quality.md` | 75 | 40% | 30 |
| `docs/sessions/webui-review-process.md` | 230 | 55% | 126 |
| `docs/sessions/dev-process/README.md` | 46 | 80% | 36 |
| `docs/sessions/dev-process/completion-principles.md` | 139 | 75% | 104 |
| `docs/sessions/dev-process/anti-patterns.md` | 150 | 75% | 112 |
| `docs/sessions/dev-process/feature-change-lateral-spread.md` | 89 | 40% | 35 |
| `docs/sessions/dev-process/github-api-head-staleness.md` | 40 | 90% | 36 |
| `docs/sessions/dev-process/parallel-agent-ops.md` | 113 | 60% | 67 |
| `docs/sessions/dev-process/qm-fix-patterns.md` | 91 | 25% | 22 |
| `docs/sessions/dev-process/research-discipline.md` | 51 | 85% | 43 |
| `.claude/skills/po/SKILL.md` | 114 | 60% | 68 |
| `.claude/skills/dev/SKILL.md` | 105 | 65% | 68 |
| `.claude/skills/qm/SKILL.md` | 148 | 60% | 88 |
| `.claude/skills/platform/SKILL.md` | 87 | 65% | 56 |
| `.claude/skills/audit/SKILL.md` | 92 | 55% | 50 |
| `.claude/skills/issue-triage/SKILL.md` | 358 | 45% | 161 |
| `.claude/skills/dev-open-pr/SKILL.md` | 373 | 25% | 93 |
| `.claude/skills/impact-analysis/SKILL.md` | 220 | 70% | 154 |
| `.claude/skills/regression-check/SKILL.md` | 56 | 40% | 22 |
| `.claude/skills/pr-review/SKILL.md` | 117 | 50% | 58 |
| `.claude/skills/adversarial-reviewer/SKILL.md` | 117 | 80% | 93 |
| `.claude/skills/policy-compliance/SKILL.md` | 222 | 65% | 144 |
| `.claude/agents/audit-manager.md` | 186 | 60% | 111 |
| `.claude/agents/dev-session.md` | 211 | 35% | 73 |
| `.claude/agents/platform-session.md` | 49 | 70% | 34 |
| `.claude/agents/po-session.md` | 97 | 50% | 48 |
| `.claude/agents/qm-session.md` | 162 | 40% | 64 |
| `CLAUDE.md`（ルート、プロセス以外を含む全体） | 176 | 15% | 26 |
| `docs/CLAUDE.md`（同上） | 217 | 20% | 43 |
| **合計（41 ファイル）** | **7,482** | **約 52%** | **約 3,880** |

**読み方** [推論]:

- 割合は「方法として持ち出せる文の比率」で、値（コマンド・label 名・閾値）を差し替えれば使える P を含めると 6〜7 割に上がる
- skill（sk/*）と agent（ag/*）の大半は docs/sessions の言い換え・抜粋で、内容が重複している。**重複を除いた汎用の方法論は 2,000 行前後**と見積もる
- 汎用率が低いのは、この repo の装置（pre-ready・PR テンプレート・workflow・hotfix の env 配布・SS 撮影）を説明する文書（dev-session.md・dev-open-pr・branch-strategy.md・clone-setup.md・qm-fix-patterns.md）
- 汎用率が高いのは、ロール間の境界と判断の作法を書いた文書（憲章・label-mailbox・agent-teams・dev-process の完遂原則 / アンチパターン / 調査規律・adversarial-reviewer・impact-analysis）
- オーナーの期待粒度に必要な「工程ごとの考え方・調査の深さ・不明時・矛盾時」は、汎用部分の中でも量が少ない（§8）。**汎用化は「既存の汎用部分を移す」だけでは足りず、その 4 観点を新しく書き足す作業が要る** [推論]
