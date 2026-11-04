# Greenhouse
温室の制御スクリプト。
- `bin/vent <室内温度> <外気温>`: 天窓の開度（%）
- `bin/sensors`: センサーごとの最新値
- `bin/water-due <苗床> <今日の通算日>`: 最後に水をやってから苗床の間隔（日）が経っていれば `due`、まだなら `next in N days`
- `bin/sched <YYYY-MM-DD>`: その日の朝 5 時の自動散水で水をやる苗床
苗床の設定は data/beds.csv（苗床,最後に水をやった通算日,間隔の日数）。環境変数 BEDS で別のファイルを指せる。

