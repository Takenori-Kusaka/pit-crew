# CLI の規約（cli-conventions）

対応する実装: src/*.sh, tools/*

## 終了コードと出力
- 終了コード: 0 成功 / 1 業務上の拒否（衝突・定員超過・該当なし など）/ 2 使い方・入力の誤り
- エラーは stderr、結果は stdout。エラーのときは stdout に何も出さない
- 失敗時に部分的な書き込みを残さない（data/ のファイルは一時ファイルに書いてから置き換える）
- 呼び出した script が失敗したら、その終了コードをそのまま返す

## 使い方・入力の誤り
- 引数の数が合わない・オプションの値が無いときは exit 2、stderr に `usage: <script のファイル名> <引数の並び>`（例 `usage: cancel.sh ROOM DATE START`）
- オプションは `--<語>` の形で、位置引数の前に置く。usage にはすべてのオプションを書く
- 日付は YYYY-MM-DD。形式が違う・月が 01〜12 でない・日が 01〜31 でないときは exit 2、stderr に `bad date: <渡された値> (expected YYYY-MM-DD)`
- 時刻は HH:MM。形式が違うときは exit 2、stderr に `bad time: <渡された値> (expected HH:MM)`

## script の作り
- src/*.sh は `set -u` を宣言する
- データファイルの場所は環境変数で差し替えられる（BOOKINGS, ARCHIVE, ROOMS。既定は data/ の下）
- 新しい script・新しいオプションは README.md の使い方に足す
- 検査は `bash tools/check`（spec/*.spec.sh を全部走らせ var/check-runs.log に記録）と `bash tools/lint`
