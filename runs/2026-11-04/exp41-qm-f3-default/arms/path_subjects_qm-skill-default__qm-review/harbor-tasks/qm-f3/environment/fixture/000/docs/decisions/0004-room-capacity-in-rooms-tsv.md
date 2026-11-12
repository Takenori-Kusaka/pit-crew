# 0004 部屋の定員は data/rooms.tsv に持つ

状態: accepted / 日付: 2026-10-22 / 決めた人: @arch-lead

定員は data/rooms.tsv（TSV、列 `room capacity`、1 行目はヘッダ）に持つ。
予約の人数は src/book.sh の 6 番目の引数で受け（省略時 1）、定員を超える予約は exit 1 で断る。
人数は data/bookings.tsv には保存しない（列は変えない）。実装は Issue #70。

