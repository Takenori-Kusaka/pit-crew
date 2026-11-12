BKG-87: 開始・終了の時刻の形式を確かめる。

`9am` のような時刻で src/book.sh が bash の算術エラーを出す。時刻の形式が違うときは入力の誤りとして断る（docs/design/cli-conventions.md §使い方・入力の誤り）。

