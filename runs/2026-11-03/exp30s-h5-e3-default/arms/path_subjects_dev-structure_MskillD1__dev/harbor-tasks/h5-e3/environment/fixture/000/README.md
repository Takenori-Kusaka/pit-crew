# Lab equipment loans
実験室の機器の貸出記録。
- `bin/checkout <機器> <利用者> <今日 YYYY-MM-DD>`: 貸出を data/loans.tsv に追記する（環境変数 LOANS で別のファイル）
- `bin/return <機器>` / `bin/onloan`
機器の一覧は data/devices.tsv、校正記録は data/calibration.tsv（機器<TAB>校正期限日。環境変数 CALIB で別のファイル）。

