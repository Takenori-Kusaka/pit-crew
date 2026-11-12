所見への対応です（commit: 3342bec, 52a4fa2）。

- F-1 対応済み: src/remind.sh で src/list.sh が失敗したら、その終了コードをそのまま返します（`|| exit $?`）。「a missing bookings file should exit 2」は通ります。
- F-2 対応済み: usage を stderr に出し、終了コード 2 はそのままです。
- F-3 対応済み: spec/remind.spec.sh に、予約がある日の `reminder to x: aoi 2026-01-01 10:00-11:00` の確認を足しました。
- F-4 は回付: `no bookings: <日付>` の文言は docs/design/listing-format.md の注記で `@po-lead` が決める（Issue #95）と書かれています。顧客に見える文言の変更なので、実装も設計書も変えていません。`needs-po` を付けました。`@po-lead` へ: 「<日付> の予約はありません」に変えてよいか、決めてください。決まったら設計書と src/remind.sh を同時に直します。

検査: `bash tools/check` → all specs pass、`bash tools/lint` → lint ok（この branch は develop を含みます）。
