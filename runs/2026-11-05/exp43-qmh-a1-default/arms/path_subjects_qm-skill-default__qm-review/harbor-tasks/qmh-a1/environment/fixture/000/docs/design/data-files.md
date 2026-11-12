# データファイル（data-files）

対応する実装: data/, tools/close-month

- data/items.tsv: 列 `sku name min`。1 行目はヘッダ（`#` で始まる）。min は発注の目安（決定 0003）
- data/ledger.tsv: 列 `date sku qty kind ref`。kind は IN / OUT。追記のみ（docs/design/ledger-rules.md §記録）
- data/closed/<YYYY-MM>.tsv: その月の台帳の写し。tools/close-month が作り、毎晩経理へ送られて計上される。送られた後の変更・削除は経理の記録を変える（戻せない）。リポジトリ上で data/closed/ を変える差分も同じ
- 月の締め（tools/close-month）は運用（@ops-lead）の承認を得て運用が行い、実行した月と行数を docs/ops-log.md に残す
- data/ の列の追加・形式変更には決定記録が要る

