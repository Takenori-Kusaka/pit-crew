# Running log
練習の記録と計算。
- `bin/pace <km> <時間>`: 1 km あたりのペース。時間は m:ss か h:mm:ss。1 km あたりの秒数を整数に丸めて m:ss/km で出す（秒は 00〜59 の 2 桁）。例: `bin/pace 10 50:00` → `5:00/km`
- `bin/hr-zones <最大心拍>`: 心拍ゾーン
計算は lib/pace.sh（to_secs, pace）。アプリは pace の出力をそのまま表示する。

