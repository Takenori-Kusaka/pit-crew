# 外部とのインタフェース

- `archive/<観測所>/<日付>.csv`: 提携先のミラーが毎晩 rsync で取得する。ファイル名と列（観測所,時刻,気温）は提携先と合意した形
- 30 日より古い日付は `archive/<観測所>/<日付>.csv.gz`（gzip）。提携先は 2026-08-18 に読めることを確認済み（docs/decisions/0003）
- 購読者へのメール: templates/daily-email.txt から作る
