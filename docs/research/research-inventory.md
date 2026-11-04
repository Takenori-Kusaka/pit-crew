# ハーネス棚卸し（要約版）

棚卸しを担当したサブエージェントは書き込み権限がなかったため、報告の全文は残っていません。このファイルは、その報告から設計に必要な部分を抜き出したものです。

## 分類

### ほぼそのまま使えるもの（汎用）

- label mailbox：宛先 6 種と工程 3 種、往路・復路の遷移表、経路マトリクス、orphan・STALE-HOLD・DUP-AXIS の検出、空が 3 回続いたら生存確認
- 作る人と承認する人の分離の原則（ADR-0022）。process-compass の ADR-0035 と一致する
- DACI（決定権の表）
- BLOCK 3 類型
- 同じ指摘が 2 周したら打ち切る規則
- QM が CI を判定する手順：statusCheckRollup を畳み込む、正しい HEAD を ls-remote で取る、three-dot diff を使う
- hooks の matcher の SSOT（`command-execution-tools.mjs`）
- Agent Teams の規約
- 完遂原則、アンチパターン、調査の規律
- 汎用的な skill：adversarial-reviewer（観点を差し替える）、impact-analysis、flake-hunt。live-ui-verification、ui-defect-hunt、cognitive-walkthrough は作法の部分だけが汎用

### 少し直せば汎用になるもの（準汎用）

- ロール別の skill と agent 5 種。直書きを外す必要がある：アカウント名、cron の分、ADR 番号、技術スタック、Issue 番号（最大 58 件）
- アカウント検証の hook と heavy lock。置き場所の `~/.buzz` と対象コマンドを設定値に出す
- pr-review、dev-open-pr、issue-triage、policy-compliance
- pre-ready：設計思想は汎用。段階の中身はプロジェクト固有

### プロジェクト専用

- age-mode-check、brand-check、customer-voice、cost-review、lp-review、pre-pmf-check、db-migration、deploy-verify、competitive-research

## 効果の根拠（書籍より）

### 効いたこと

- オーナーが手で中継していた往復（1 日 8 回）がなくなった
- PR の作成から merge までの中央値が 1.9 時間
- 7 か月間、1 日あたりコミット 14 件・merge 10.7 件で横ばい
- 統合 PR を機械名義で作るようにして、なりすましが 0 件になった

### 失敗と副作用

- QM の役割ドリフトが 33 日で 42 回
- 装置コードが製品コードの 0.76 倍、Issue の 56% が装置関連
- 装置の不具合で本番 NUC が 3.5 時間停止
- 21 日で QM の応答が全体の 64%（従量換算で約 1.8 万ドル）
- docs/sessions が 4 か月間読み込まれていなかった（取り込みの配線ミス）
- ハーネスの有無で比べる統制実験はない。根拠は定性的な前後比較が中心

## process-compass との対応

- 標準の 3.5.1（ロール別クローン）と 3.5.5（受信箱ラベル）は、このハーネスを規格化したもの。pit-in-template には process.config.json（`roles[]` / `MAILBOX`）と adapters、profiles がある
- ハーネスが強い区間：AI 実装、G-5 自動検証、G-6 分離レビュー、G-7 監査
- 弱い区間：G-1〜G-4、H-1〜H-3、運用の 19 指標
- 標準からの逸脱：
  - Review と Ship が 1 つのレーン
  - QM と監査が同じアカウント
  - `needs-tech` がない（G-3 の技術判断者の席が空いている）
  - ラベルを遷移させる前に判定を記録する規則がない
  - QM が自分で直したものを自分で承認する
- 会社のロールとの対応：rereview → Review、QM → Ship、maintenance → Platform（必要なら Ops を別に置く）

## 会社で詰まった 3 点への対応状況

### (1) Dev の進め方

- OSS を先に調べるルール（#1350）：起票時・着手時・PR 時の 3 か所に書かれており、汎用
- テストファースト：バグ修正だけに適用されている（ADR-0061 の failing-test-first）。新機能には強制がない
- テストピラミッド：`tests/CLAUDE.md` にあるが API 層の分類がない。unit と integration が `tests/unit` に混在している
- PR の規模の上限：ない（process-compass には maxChangedLines 400 がある）
- DDD：名前が出てくるだけで、ユビキタス言語・境界づけられたコンテキスト・集約の指針はない
- 矛盾：dev-session agent は「コミット前に playwright を全部通す」と書いているが、heavy lock と「CI で確定する」方針と食い違っている
- 不足：着手チェックリストの skill（調査 → スコープ → テスト設計 → 層の決定 → 実装）

### (2) QM のレビュー前提と権限

- qm-session.md の参照表は表があるだけで、読むことは強制されていない。しかも qm-session.md 自体が常に読み込まれているわけではない
- qm の手順 5 つに「設計書を読む」がない。qm-agent-templates も設計書を読むよう指示していない
- 良い点：`git show origin/develop:<path>` で base の正本を読む手順
- policy-compliance の「意図的な設計かを確かめる」段は、監査でしか使われておらず PR ごとのレビューにはない
- 権限：DACI と BLOCK 3 類型で越権を抑えている。ただし**外部からの質問に答えてよい人（対外回答の A）が定義されていない**
- 矛盾：pr-review の Step 0 は「PO の Yes/No を得てから merge」、憲章 §0 ルール 3 は「merge を止めない」
- 不足：
  - 手順 0 として「変更されたパスから機械的に設計書・ADR・CLAUDE.md を引いて読み、読んだ一覧を証跡の JSON に残す」
  - DACI に対外回答の行を足す
  - PR ごとのレビューに policy-compliance の ① を入れる

### (3) 設計書の矛盾による Dev↔QM のループ

- ADR-0001（設計書が SSOT）はあるが、文書同士の優先順位は書かれていない
- 2 周で打ち切る規則はあるが、打ち切った後に誰が裁くかがない
- 技術的な矛盾は PO の担当外。DACI では Dev が A なのに、QM は pr-review の F で止められる。このため当事者同士のループになる
- completion-principles §7（元の Issue を再オープンし、設計書を単独 PR で直してから戻る）が最も近いが、Dev 側の規律でしかない
- 文書同士の矛盾を機械で検出する仕組みはない
- 不足：
  - SSOT の優先順位表（同じ順位で矛盾したら裁定者に上げる）
  - `state:needs-tech` と技術判断者
  - 2 周で打ち切った後の遷移を「設計書の修正 PR を裁定 → 元の PR を再開」にする
  - 文書同士の矛盾を定期的に棚卸しする（Platform の仕事）
  - 既定値として process-compass の selfHealMaxIterations 3 と noProgress 2 を採る

## core と adapter の分け方（案）

### core

- ロール定義の骨格（決めること / 決めないこと / 受信箱 / 戻る経路 / 禁止事項）
- 憲章のテンプレート（DACI、BLOCK 3 類型、打ち切り、運用モード）
- label mailbox 一式（語彙、遷移、jq、cron のプロンプト、ラベルの初期化、経路の欠落を検出するテスト）
- hooks（matcher の SSOT、アカウントガード、heavy lock、gate-approve は任意）
- 証跡の検査（adversarial の JSON Schema、statusCheckRollup、HEAD の検証）
- 汎用 skill
- 配線のテスト（`@` 取り込みの解決、CI の hard-fail 一覧との突合）
- 計測（手戻り 3 指標をラベルの履歴から集計）

### adapter

- `harness.config.json`：repo、accounts、roles（clone / cron / inbox）、labels、branches、irreversibleOps、ssot.precedence、preReady、heavyLock、adversarialAxes、language
- プロジェクト固有の SSOT 文書、環境構築の手順

### product pack

- ドメイン専用の skill

### 既定の構成

- process-compass の標準（Review と Ship を分ける、needs-tech を置く）を既定にする
- ganbari 型の構成は「一人体制」のプロファイルとして、標準からの逸脱を記録したうえで提供する
