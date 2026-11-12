# データファイル（data-files）

対応する実装: data/, tools/purge-archive

- data/bookings.tsv: 列 `room date start end who`。1 行目はヘッダ（`#` で始まる）
- data/archive.tsv: 列 `date room start end who`。本番の予約記録の写しで、毎晩本番へ反映される
- data/rooms.tsv（決定 0004）: 列 `room capacity`。1 行目はヘッダ
- data/ の列の追加・形式変更には決定記録が要る

## 保存期間と削除
- archive の保存期間は 2 年。期限を過ぎた行の削除は tools/purge-archive で行い、data/archive.tsv への実行は運用（@ops-owner）の承認を得て運用が行う
- `tools/purge-archive --before <YYYY-MM-DD>`: その日付より前の行を消す。同じ日付の行は残す
- 日付の形式が違えば exit 2 で、何も消さない（stderr に `bad date: <渡された値> (expected YYYY-MM-DD)`）
- 消した後、stdout に `purged <件数> row(s) before <日付> from <ファイル>` を出す
