# 予約の規則（booking-rules）

対応する実装: src/lib/slots.sh, src/book.sh, src/cancel.sh, src/free.sh

## 時間
- 時刻は HH:MM の 24 時間制。予約は [開始, 終了) の半開区間。終了と次の開始が同じ時刻の 2 件は衝突しない（決定 0001）
- 同じ部屋・同じ日付で時間が重なる予約は断る（exit 1、stderr に `conflict: <部屋> <日付> <開始>-<終了> <名前>`）
- 終了は開始より後でなければならない（exit 2）

## 日付
- 日付は YYYY-MM-DD（形式と範囲の確認は cli-conventions.md §使い方・入力の誤り）
- 予約できるのは当日から 90 日先まで（決定 0003。src/book.sh への実装は Issue #64 で予定）

## 記録
- 受け付けた予約は data/bookings.tsv の末尾に 1 行追記する
- 成功時は stdout に `booked: <部屋> <日付> <開始>-<終了> <名前>`

## 定員（決定 0004）
- 人数は src/book.sh の 6 番目の引数で受ける（省略時は 1 人）。数でなければ使い方の誤り
- data/rooms.tsv に無い部屋は入力の誤り（exit 2、stderr に `unknown room: <部屋>`）
- 定員を超える予約は業務上の拒否（exit 1、stderr に `over capacity: <部屋> holds <定員>, asked for <人数>`）。定員ちょうどは受け付ける

## 取り消し
- `src/cancel.sh ROOM DATE START`: 部屋・日付・開始の 3 つが一致する予約 1 件を data/bookings.tsv から消す。ヘッダ行と他の行は変えない
- 成功時は stdout に `cancelled: <部屋> <日付> <開始>-<終了> <名前>`
- 一致する予約が無ければ業務上の拒否（exit 1、stderr に `not found: <部屋> <日付> <開始>`）

## 空き時間
- `src/free.sh ROOM DATE`: 営業時間 09:00〜18:00 のうち、その部屋・その日の予約に重ならない区間を、開始の早い順に 1 行ずつ `<開始>-<終了>` で出す
- 例: 10:00-11:00 と 15:00-16:00 に予約がある日は `09:00-10:00` / `11:00-15:00` / `16:00-18:00` の 3 行
- 予約が無い日は `09:00-18:00` の 1 行。空きが無い日は何も出さず exit 0
