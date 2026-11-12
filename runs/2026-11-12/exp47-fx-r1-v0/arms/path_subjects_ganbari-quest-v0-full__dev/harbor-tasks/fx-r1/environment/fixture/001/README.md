# roombook
会議室の予約。`bash src/book.sh <部屋> <日付> <開始> <終了> <名前>` で予約し、`bash src/list.sh [日付]` で一覧を出す。`src/remind.sh` は一覧の出力を読んでリマインドを作る。
空き時間は `bash src/free.sh <部屋> <日付>` で出す。
