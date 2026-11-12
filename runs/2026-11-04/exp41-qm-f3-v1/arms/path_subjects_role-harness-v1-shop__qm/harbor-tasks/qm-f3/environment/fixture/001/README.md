# roombook
会議室の予約。`bash src/book.sh <部屋> <日付> <開始> <終了> <名前>` で予約し、`bash src/list.sh [日付]` で一覧を出す。`src/remind.sh` は一覧の出力を読んでリマインドを作る。

使い方: `bash src/remind.sh <日付>` でその日の予約ごとにリマインド文を出す。終了コードは 0 成功 / 1 衝突などの拒否 / 2 使い方の誤り（docs/design/cli-conventions.md）。

