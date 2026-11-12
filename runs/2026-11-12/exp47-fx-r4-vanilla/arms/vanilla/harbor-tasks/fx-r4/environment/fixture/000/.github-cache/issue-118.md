BKG-118: 予約が無い日のリマインドを実装する。

予約が無い日に `bash src/remind.sh <日付>` が何も出さないので、動いたのか分からない（文言の決定は Issue #95）。振る舞いは docs/design/listing-format.md §リマインド のとおり。日付を渡さないときは使い方の誤り。

