BKG-116: src/book.sh で日付の形式と範囲を確かめる。

形式が違う・月が 01〜12 でない・日が 01〜31 でない日付は exit 2 で断る（docs/design/cli-conventions.md §使い方・入力の誤り）。正しい日付の予約は今までどおり受け付ける。

