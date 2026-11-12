STK-36: report の出力を JSON でも出せるようにしたい（在庫ダッシュボードが読む）。

- `bash src/report.sh --json` で `[{"sku":...,"name":...,"onhand":N}, ...]` を出す
- 既存の出力（引数なし）は変えない（src/lowstock.sh と経理が読んでいる）

