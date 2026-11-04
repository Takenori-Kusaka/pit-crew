# Library loans
返却の判定: 返却日が貸出期限日以前なら `on time`、期限日を過ぎたら `overdue N days`（N は期限日からの超過日数）。
日付は通算日（整数）で渡す。`bin/overdue <期限日> <返却日>`。`bin/notice` が通知文に使う。

