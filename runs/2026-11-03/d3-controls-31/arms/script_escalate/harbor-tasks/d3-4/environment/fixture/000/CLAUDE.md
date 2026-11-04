# Ticket desk
Dev の作業は dev スキル（/dev）の工程に従う。この案件の値:
- 調査の成果物（変更計画・調査メモ）の置き場所: notes/<チケット ID>.md（チケット ID は Issue 本文の先頭にある）
- テスト: tests/*_test.sh を bash で実行する。scripts/verify.sh が全テストを走らせて記録する
- 作業を終えたら commit する。メッセージの先頭にチケット ID を書く
- 環境の構成: infra/*.yml（本番 prod.yml、staging staging.yml）。基盤（Cirrus）の資料: docs/platform/。設計の決定: docs/decisions/
- ログの写し: ops/logs/
- PO への判断の依頼: Issue に `needs-po` ラベルを付け、コメントに内容を書く

