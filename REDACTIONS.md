# 公開版で除いたもの・置き換えたもの

このリポジトリは、非公開の作業リポジトリのコミット `1c1540ea8a5b93f5543858a0050f2fb7795d9c56`（2026-11-04）の内容を 1 コミットにまとめたスナップショットです。公開にあたり、次の 3 点だけを作業リポジトリから変えています。値そのものはここに書きません。

## 1. Claude Code のセッション状態ファイルを除外した（23,252 ファイル）

評価の各試行で、エージェントのコンテナ内の Claude Code が書いた設定・状態ファイルが `runs/**/agent/sessions/` に残っていました。アカウントの識別子を含むため、会話記録以外の状態ファイルを除外しました。

| 除外したパターン（`runs/**/agent/sessions/` からの相対パス） | ファイル数 |
|---|---|
| `.claude.json` | 2,583 |
| `backups/.claude.json.backup.<数字>` | 2,600 |
| `policy-limits.json` | 2,583 |
| `policy-limits.json.stamp.json` | 2,583 |
| `policy-limits.json.signature.json`（署名付き JWT） | 2,573 |
| `remote-settings.json` | 2,583 |
| `remote-settings.json.synced-at` | 2,583 |
| `.last-cleanup` | 2,581 |
| `plugins/store/*.json` | 2,583 |

statsig・telemetry・認証情報・`settings*.json` の形のファイルも除外の対象にしましたが、該当は 0 件でした。

残したもの: 会話記録（`projects/-app/*.jsonl`、サブエージェントの `subagents/*.jsonl` と `*.meta.json`、`tool-results/*.txt`）、試行に渡したスキルの写し（`skills/**`）、ほかのすべての実行記録（`results.json`、`report.md`、`raw-*`、judge の再判定など）。

## 2. 識別子を固定の文字列に置き換えた

除外したファイルから、識別子の値を先に集めました（`.claude.json` の `userID` と `machineID`、JWT の `sub`・`aud`・`ws`）。

| 種類 | 異なる値の数 | 置き換え先 |
|---|---|---|
| アカウント ID（JWT `sub`） | 1 | `ACCOUNT_ID_REDACTED` |
| 組織 ID（JWT `aud`） | 1 | `ORGANIZATION_ID_REDACTED` |
| ワークスペース ID（JWT `ws`） | 1 | `WORKSPACE_ID_REDACTED` |
| `userID` | 2,583 | `USER_ID_REDACTED` |
| `machineID` | 2,583 | `MACHINE_ID_REDACTED` |

残したファイル全体を検索した結果、集めた値はどれも除外したファイルの外には出ていませんでした。置き換えは 0 か所です。公開版で集めた値が 0 件であることを、公開前に再検索して確かめています。

## 3. 外部のマーケットプレイスの名前を一般名に置き換えた

発端の勧誘メールを送ってきた、エージェント向けスキルのマーケットプレイスの固有名を「エージェントのスキルのマーケットプレイス」に置き換えました（文意を保つ範囲で助詞の前後の空白を詰めています）。対象は次の 7 ファイルです。

- `docs/log/2026-10-31.md`、`docs/log/2026-11-01.md`
- `docs/planning/00-owner-statements.md`、`docs/planning/01-proposal.md`
- `docs/research/README.md`、`docs/research/research-market.md`、`docs/research/research-synthesis.md`

| 置き換えたもの | 件数 | 置き換え先 |
|---|---|---|
| サービス名（ドメイン付きを含む） | 28 | エージェントのスキルのマーケットプレイス |
| 運営会社の法人名 | 2 | 「オランダ法人」「〜の運営会社」 |
| サービスのサイトの URL | 10 | （URL 省略） |
| プレスリリースの URL（サービス名を含む） | 1 | （URL 省略） |
| 創業者の個人名と、その出典の URL 2 本（サービスのサイト・LinkedIn） | 1 か所 | 「個人名のため省略」「（出典 URL 省略）」 |

`docs/research/research-market.md` の調査内容（規約の要約・数値・判断）はそのまま残しています。

---

# 2026-11-12 のスナップショット（追記）

非公開の作業リポジトリのコミット `198869121b2cad4fffedc1a118a0f1365dfd0729` の内容を、上のスナップショットの上に 1 コミットで重ねたものです。方法は上と同じで、台本は `scripts/publish-snapshot.py` です。値そのものはここに書きません。

## 1. セッション状態ファイルの除外（23,252 ファイル。前回分を含む全体の数）

| 除外したパターン（`runs/**/agent/sessions/` からの相対パス） | ファイル数 |
|---|---|
| `.claude.json` | 2,583 |
| `.last-cleanup` | 2,581 |
| `backups/.claude.json.backup.<n>` | 2,600 |
| `plugins/store/*.json` | 2,583 |
| `policy-limits.json` | 2,583 |
| `policy-limits.json.signature.json` | 2,573 |
| `policy-limits.json.stamp.json` | 2,583 |
| `remote-settings.json` | 2,583 |
| `remote-settings.json.synced-at` | 2,583 |

## 2. 識別子の値

除外したファイルから集めた値の数: アカウント ID 1、組織 ID 1、ワークスペース ID 1、`userID` 2,583、`machineID` 2,583。残したファイル全体を検索し、集めた値を含むファイルは **0 件**、署名付き JWT を含むファイルも **0 件** でした（0 件でなければ台本は commit を作らずに止まります）。

## 3. マーケットプレイスの名前

対象は前回と同じ 7 ファイルです。前回から変わっていないファイルは置き換え済みの版をそのまま使い、変わったファイルは置き換え済みの版にその後の差分を当てました。作業リポジトリ側で新しく固有名が書かれた行は 0 件です。

## 4. 追加で除外したもの

`experiments/live/out/`（4 ファイル）: 別のプロジェクトの実際の作業セッションを採点した出力です。採点の台本（`experiments/live/grade-session.mjs`）と仕様は残しています。

---

# 2026-11-13 のスナップショット（追記）

非公開の作業リポジトリのコミット `e2339e7655c036b55fc8b82e168e90b6dba94864` の内容を、上のスナップショットの上に 1 コミットで重ねたものです。方法は上と同じで、台本は `scripts/publish-snapshot.py` です。値そのものはここに書きません。

## 1. セッション状態ファイルの除外（23,252 ファイル。前回分を含む全体の数）

| 除外したパターン（`runs/**/agent/sessions/` からの相対パス） | ファイル数 |
|---|---|
| `.claude.json` | 2,583 |
| `.last-cleanup` | 2,581 |
| `backups/.claude.json.backup.<n>` | 2,600 |
| `plugins/store/*.json` | 2,583 |
| `policy-limits.json` | 2,583 |
| `policy-limits.json.signature.json` | 2,573 |
| `policy-limits.json.stamp.json` | 2,583 |
| `remote-settings.json` | 2,583 |
| `remote-settings.json.synced-at` | 2,583 |

## 2. 識別子の値

除外したファイルから集めた値の数: アカウント ID 1、組織 ID 1、ワークスペース ID 1、`userID` 2,583、`machineID` 2,583。残したファイル全体を検索し、集めた値を含むファイルは **0 件**、署名付き JWT を含むファイルも **0 件** でした（0 件でなければ台本は commit を作らずに止まります）。

## 3. マーケットプレイスの名前

対象は前回と同じ 7 ファイルです。前回から変わっていないファイルは置き換え済みの版をそのまま使い、変わったファイルは置き換え済みの版にその後の差分を当てました。作業リポジトリ側で新しく固有名が書かれた行は 0 件です。

## 4. 追加で除外したもの

`experiments/live/out/`（4 ファイル）: 別のプロジェクトの実際の作業セッションを採点した出力です。採点の台本（`experiments/live/grade-session.mjs`）と仕様は残しています。

---

# 2026-11-13 のスナップショット（追記）

非公開の作業リポジトリのコミット `399bf63f0f776ed2431432bb033aed992b5d5a92` の内容を、上のスナップショットの上に 1 コミットで重ねたものです。方法は上と同じで、台本は `scripts/publish-snapshot.py` です。値そのものはここに書きません。

## 1. セッション状態ファイルの除外（23,252 ファイル。前回分を含む全体の数）

| 除外したパターン（`runs/**/agent/sessions/` からの相対パス） | ファイル数 |
|---|---|
| `.claude.json` | 2,583 |
| `.last-cleanup` | 2,581 |
| `backups/.claude.json.backup.<n>` | 2,600 |
| `plugins/store/*.json` | 2,583 |
| `policy-limits.json` | 2,583 |
| `policy-limits.json.signature.json` | 2,573 |
| `policy-limits.json.stamp.json` | 2,583 |
| `remote-settings.json` | 2,583 |
| `remote-settings.json.synced-at` | 2,583 |

## 2. 識別子の値

除外したファイルから集めた値の数: アカウント ID 1、組織 ID 1、ワークスペース ID 1、`userID` 2,583、`machineID` 2,583。残したファイル全体を検索し、集めた値を含むファイルは **0 件**、署名付き JWT を含むファイルも **0 件** でした（0 件でなければ台本は commit を作らずに止まります）。

## 3. マーケットプレイスの名前

対象は前回と同じ 7 ファイルです。前回から変わっていないファイルは置き換え済みの版をそのまま使い、変わったファイルは置き換え済みの版にその後の差分を当てました。作業リポジトリ側で新しく固有名が書かれた行は 0 件です。

## 4. 追加で除外したもの

`subjects/ganbari-quest-v0/`・`subjects/ganbari-quest-v0-full/` の中身（`SOURCE.md` を除く、32 ファイル）: がんばりクエスト（AGPL-3.0）のハーネスの写しで、比較の相手として使ったもの（オーナー 2026-11-13: GQ が比較の相手ならはぶく）。公開されている GQ の commit `0b32d8bab2e0e6f7ac29eda3d8e646572189dd12` から `experiments/structure/make-v0.mjs` → `make-v0full.mjs` でバイト単位で同じものを作り直せる（2026-11-13 に確認）。**2026-11-04 と 2026-11-12 のスナップショットにはこの写しが入っている**（履歴は書き換えていない）。また、この写しを使った比較の実行記録（`runs/` の中）には、エージェントが読んだ文としてスキルの断片が残っている（採点の再現に要るので残した）

`experiments/live/out/`（4 ファイル）: 別のプロジェクトの実際の作業セッションを採点した出力です。採点の台本（`experiments/live/grade-session.mjs`）と仕様は残しています。
