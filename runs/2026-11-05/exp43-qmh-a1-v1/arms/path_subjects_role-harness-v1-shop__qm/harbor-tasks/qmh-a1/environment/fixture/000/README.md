# stockcount
倉庫の在庫台帳。`bash src/move.sh <SKU> <数量> <IN|OUT> <伝票>` で入出庫を記帳し、`bash src/report.sh` で品目ごとの手持ちを出す。`bash src/lowstock.sh` は report の出力を読んで発注の目安（min を下回る品目）を出す。月の締め `bash tools/close-month <YYYY-MM>` は運用だけが実行する。

