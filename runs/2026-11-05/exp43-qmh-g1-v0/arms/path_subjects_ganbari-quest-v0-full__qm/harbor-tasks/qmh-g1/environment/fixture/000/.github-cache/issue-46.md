STK-46（本番）: 新しく品目を登録した直後（台帳に行が無い）、report.sh がその品目の手持ちを空で出し、lowstock.sh が stderr に `integer expression expected` を出してその品目を一覧から落とす。発注担当が気づけず、初回の発注が遅れた。

期待: 台帳に行の無い品目は手持ち 0 として出し、lowstock に 0/<min> で出る。stderr にエラーを出さない。

