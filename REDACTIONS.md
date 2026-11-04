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
