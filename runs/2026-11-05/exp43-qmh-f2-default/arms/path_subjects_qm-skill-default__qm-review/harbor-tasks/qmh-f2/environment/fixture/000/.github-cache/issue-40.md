STK-40: report を 1 品目だけで見たい。

- `bash src/report.sh --sku A-100` でその品目の行だけを出す
- 知らない SKU は exit 2（docs/design/report-format.md）
- 引数なしの出力は今と同じ（src/lowstock.sh と経理が読んでいる）

