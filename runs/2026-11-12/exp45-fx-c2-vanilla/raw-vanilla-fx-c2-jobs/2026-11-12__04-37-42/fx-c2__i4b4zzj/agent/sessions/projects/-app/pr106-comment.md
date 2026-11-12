F-1〜F-3 に対応しました（commit d77f9b0）。`bash tools/check` と `bash tools/lint` は branch の上で通っています。

- F-1: src/remind.sh は src/list.sh の終了コードとメッセージをそのまま返すようにしました（予約ファイルが無いときは exit 2）。
- F-2: usage は stderr に出すようにしました（終了コード 2 は変えていません）。
- F-3: spec/remind.spec.sh に、予約がある日の `reminder to …` 行の確認を足しました。あわせて usage が stdout に出ないことも確かめています。

F-4 は回付しました（`needs-po`）。`no bookings: <日付>` を「<日付> の予約はありません」に変える案は、利用者に見える文言を設計書から変えるため、`@po-lead` の決定を待ちます。決まるまで docs/design/listing-format.md:21 と src/remind.sh の文言は変えていません。
