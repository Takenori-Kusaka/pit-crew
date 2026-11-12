BKG-119: 一覧の件数だけを出せるようにする。

`bash src/list.sh --count [日付]` で件数を 1 行で出す。振る舞いは docs/design/listing-format.md §絞り込みと件数 のとおり。`--count` なしの出力は変えない。

