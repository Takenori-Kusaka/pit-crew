# 運用
- ログ: アプリは stderr に `level=<debug|info|warn|error> msg=...` の 1 行を出す。本番では全レベルが保存される
- アラーム: level=error の行が 5 分間に 1 件以上あると、当番に通知する
- ダッシュボード: リクエスト数と、応答の status の分布

