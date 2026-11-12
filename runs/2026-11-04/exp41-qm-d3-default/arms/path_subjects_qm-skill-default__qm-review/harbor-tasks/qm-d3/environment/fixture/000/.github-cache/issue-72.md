BKG-72: 一覧を部屋で絞り込めるようにする。

- `bash src/list.sh --room aoi` で aoi の予約だけを出す
- 日付と一緒にも使える: `bash src/list.sh --room aoi 2026-11-10`
- 何も付けないとき・日付だけのときの出力は今と同じ（src/remind.sh が読んでいる）

