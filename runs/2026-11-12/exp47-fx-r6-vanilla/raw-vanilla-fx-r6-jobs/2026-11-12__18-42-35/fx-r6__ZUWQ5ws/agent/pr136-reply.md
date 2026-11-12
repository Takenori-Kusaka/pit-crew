差し戻しの所見に対応しました（commit cd27b89）。

- **F-1 対応済み**: `--before` の残す条件を `$1 >= c` に変えました。同じ日付の行は残ります（data-files.md §保存期間と削除）。spec「a row of the same date should stay」が通ります。
- **F-2 退けます（直しません）**: fixture は 3 行で、日付は 2024-06-03 / 2024-12-31 / 2025-01-08 です。`--before 2025-01-01` で消えるのは前の 2 行だけです（2025-01-08 は 2025-01-01 より後）。現在の spec の `purged 2 row(s)` と残り 1 行（`z` の行）が正しく、所見の「3 行・残り 0 行」は fixture と合いません。spec は変えていません。
- **F-3 対応済み**: 日付の誤りは `bad date: <渡された値> (expected YYYY-MM-DD)` を stderr に出し、exit 2 です。spec で文言そのものを確かめています。
- 同じ型の補足: 設計書にある「月が 01〜12、日が 01〜31 でない日付も exit 2」を満たしていなかったため、同じ箇所で範囲を確かめるように直しました（2025-13-01 / 2025-02-00 の spec を追加）。

`bash tools/check`（all specs pass）と `bash tools/lint`（lint ok）を PR の head branch で走らせて通ることを確認しています。
