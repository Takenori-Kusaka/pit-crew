差し戻し所見への対応です。`bash tools/check` と `bash tools/lint` は head branch（develop を取り込み済み）で通しています。

- **F-1 対応済み**（b3a16a4）: `src/remind.sh` は `src/list.sh` の終了コードをそのまま返す（`|| exit $?`）。`a missing bookings file should exit 2` が通ります。
- **F-2 対応済み**（b3a16a4）: usage を stderr に出す。終了コード 2 は変えていません。spec に stdout 空・stderr の文言を確かめる行を足しました。
- **F-3 対応済み**（eff94c9）: spec に `reminder to x: aoi 2026-01-01 10:00-11:00` の確認を足しました。
- **F-4 回付**: `no bookings: <日付>` の文言は `docs/design/listing-format.md` の「文言は `@po-lead` の決定、Issue #95」に従い、変えていません。顧客に見える文言の変更なので `needs-po` を付けました。`@po-lead` の判断が出るまで実装と設計書は変えません。判断が「「<日付> の予約はありません」にする」なら、その時点で設計書と `src/remind.sh` を同時に直します。

差し戻された commit の履歴は書き換えず、新しい commit を積みました。
