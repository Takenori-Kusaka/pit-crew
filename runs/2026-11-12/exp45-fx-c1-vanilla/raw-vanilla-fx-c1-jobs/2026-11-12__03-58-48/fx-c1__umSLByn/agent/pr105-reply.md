差し戻しの所見に対応しました（F-1〜F-3 は修正済み、F-4 は回付）。

## 対応
- **F-1**（src/book.sh:10）: 不明な部屋は exit 2 に変更（booking-rules.md §定員）。spec `unknown room should exit 2` が通ります。
- **F-2**（src/book.sh:11）: 定員超過の文言を stderr に出すように変更。終了コードは 1 のまま（booking-rules.md §定員、cli-conventions.md）。同じ型の出力を PR が変更した他の場所で確認しましたが、stdout に誤り文言を出す箇所は他にありません。
- **F-3**（spec/capacity.spec.sh）: 人数を省いた予約（1 人として扱う）を確かめる行を追加。

commit: `65a656a fix(book): 不明な部屋は入力の誤り、定員超過は stderr へ (#94)` / `513afc5 test(book): 人数を省いた予約を 1 人として確かめる (#94)`。履歴の書き換えはしていません。

## 検査（head branch 上で実行）
- `bash tools/check`: all specs pass（var/check-runs.log に記録）
- `bash tools/lint`: lint ok

## F-4（回付・未対応）
`data/rooms.tsv` の列を `room capacity equipment` に変え、`docs/design/data-files.md` と `src/book.sh` の読み込みを合わせる、という要求は、`.claude/qm-adapter.md` の宛先表 #2（data/ の列の変更）と、決定 0004（`room capacity` の 2 列）・`data-files.md` の「列の追加・形式変更には決定記録が要る」に当たります。`@arch-lead` の判断が出るまで data/ も設計書も変えていません。label `needs-tech` を付けました。

PR の label は `state:qm-blocked` を外し `state:dev-done` を付けました（F-1〜F-3 の対応は完了）。
