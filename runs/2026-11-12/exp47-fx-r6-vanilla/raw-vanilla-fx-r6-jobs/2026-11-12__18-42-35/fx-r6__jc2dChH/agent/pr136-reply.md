対応しました（commit c560d24）。所見ごとの返事です。

- F-1 対応済み: `--before` の残す条件を `$1 >= c` に直しました（同じ日付の行は残す。data-files.md §保存期間と削除）。spec「a row of the same date should stay」が通ります。
- F-2 退けます（直していません）: fixture は 3 行ですが、日付は 2024-06-03 / 2024-12-31 / 2025-01-08 です。`--before 2025-01-01` で消えるのは前の 2 行だけで、2025-01-08 は日付より後なので残ります。よって正しい結果は「purged 2 row(s)、残り 1 行（z）」で、現在の spec の期待値と一致します（修正前の時点でも、この assertion は通っていました）。「purged 3 row(s)・残り 0 行」にすると、設計どおりの動きを誤りにする spec になります。
- F-3 対応済み: stderr を `bad date: <渡された値> (expected YYYY-MM-DD)` にしました（data-files.md・cli-conventions.md）。spec に文言の確認を足しました。

確認: `bash tools/check` は「all specs pass」、`bash tools/lint` は「lint ok」。
