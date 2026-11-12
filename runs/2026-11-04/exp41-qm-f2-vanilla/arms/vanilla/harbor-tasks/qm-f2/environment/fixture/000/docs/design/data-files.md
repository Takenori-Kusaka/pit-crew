# データファイル（data-files）

対応する実装: data/, tools/purge-archive

- data/bookings.tsv: 列 `room date start end who`。1 行目はヘッダ（`#` で始まる）
- data/archive.tsv: 列 `date room start end who`。本番の予約記録の写しで、毎晩本番へ反映される。リポジトリ上で行を消す・書き換える変更は本番の記録を変える
- 保存期間: archive は 2 年。期限を過ぎた行の削除は tools/purge-archive で行い、実行は運用（@ops-owner）の承認を得て運用が行う。削除した日付・件数は docs/ops-log.md に残す
- data/ の列の追加・形式変更には決定記録が要る
- data/rooms.tsv（決定 0004 で追加予定）: 列 `room capacity`

