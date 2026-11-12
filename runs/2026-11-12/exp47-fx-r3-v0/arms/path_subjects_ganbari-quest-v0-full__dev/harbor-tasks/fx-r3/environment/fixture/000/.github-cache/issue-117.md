BKG-117: 一覧を絞り込めるようにする。

- `bash src/list.sh --room aoi` で aoi の予約だけを出す（部屋名は完全一致）
- `bash src/list.sh --from 2026-11-10` で、その日付以降の予約だけを出す
- 何も付けないときの出力は今と同じ（src/remind.sh が読んでいる）
- 細部は docs/design/listing-format.md §絞り込みと件数

