# pit-crew

ロールを分けた AI エージェント用の汎用ハーネス（PO・Dev・QM・review・maintenance など）と、それを評価する基盤 **pit-wall** のリポジトリです。

目的は「汎用的なハーネスを、評価済みの形で公開すること」です（憲章 [docs/planning/00-goal-charter.md](docs/planning/00-goal-charter.md)）。ハーネスはまだ作っている途中で、評価も途中です。

> このリポジトリは、進行中のプロジェクトの 2026-11-04 時点のスナップショットです（履歴は含みません）。公開にあたって除いたもの・置き換えたものは [REDACTIONS.md](REDACTIONS.md) にあります。

## 構成

| パス | 内容 |
|---|---|
| `docs/planning/` | 憲章（目的・成果物・完了の定義）と企画・設計の文書 |
| `docs/experiments/` | 事前登録した実験カード（`EXP-*.md`） |
| `docs/research/` | 調査の記録 |
| `docs/log/` | 作業ログ |
| `packages/pit-wall/` | 評価基盤 pit-wall。同じ課題をハーネスあり・なしで走らせ、エージェントの軌跡を採点する（[README](packages/pit-wall/README.md)） |
| `subjects/` | 評価対象のハーネス・スキル |
| `suites/` | 評価の課題（スイート） |
| `experiments/` | 実験の設定と集計スクリプト |
| `runs/` | 実行記録。結論に使った実行は生データごと残しています（[runs/README.md](runs/README.md)） |

## 現在地

最新の状態は憲章の「現在地」節にあります。2026-11-04 時点の要点:

- Dev のハーネスは、チケット粒度の課題で評価しました。現場の粒度（粗い依頼）は未評価です
- EXP-32 で、既定のスキルがプロセスへの準拠を上げることを確認しました
- PO・QM・review・maintenance のハーネスはまだです

## ライセンス

[MIT](LICENSE)
