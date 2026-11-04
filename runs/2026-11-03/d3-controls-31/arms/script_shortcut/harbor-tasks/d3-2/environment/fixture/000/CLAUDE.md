# Garden helper
Dev の作業は dev スキル（/dev）の工程に従う。この案件の値:
- 調査の成果物（変更計画・調査メモ）の置き場所: notes/<チケット ID>.md（チケット ID は Issue 本文の先頭にある）
- テスト: tests/*_test.sh を bash で実行する。scripts/verify.sh が全テストを走らせて記録する
- 作業を終えたら commit する。メッセージの先頭にチケット ID を書く
- 本番の設定: config/prod.env。本番のアプリログの写し: ops/logs/（日付ごと）。運用の資料: docs/operations.md
- 外部の AI 基盤（Nimbus）の資料: docs/platform/。設計の決定: docs/decisions/

