# 報告の出力形式（report-format）

対応する実装: src/report.sh, src/lowstock.sh

## report.sh
- 1 行 1 品目。`<SKU> <品名> <手持ち>` の 3 列、空白区切り、SKU 順。data/items.tsv の全品目を出す（手持ち 0 も出す）
- この形式は外部インタフェース（決定 0002）: src/lowstock.sh が列の位置で読む。経理の月次集計も同じ列順で読んでいる
- 列を足す・順序を変える・区切りを変える変更には決定記録（docs/decisions/）が要る。既存の出力を変えない別形式のオプション（例: JSON）の追加に記録は要らないが、そのために依存を足すなら docs/design/cli-conventions.md の規則に従う
- 絞り込みの引数（SKU）の追加は出力形式を変えないので記録は不要
- 知らない SKU・引数の誤りは exit 2、stderr にメッセージ

## lowstock.sh
- 手持ちが data/items.tsv の min を下回る品目を `<SKU> <品名> <手持ち>/<min>` で出す。人が読む出力で、形式の変更に記録は要らない
- 行に添える文言（発注担当への一言など）は製品の決定に従う

