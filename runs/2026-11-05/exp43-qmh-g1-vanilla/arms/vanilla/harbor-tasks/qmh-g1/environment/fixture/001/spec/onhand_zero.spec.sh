#!/bin/bash
fail=0
l=$(mktemp); i=$(mktemp)
printf '# h\n2026-10-01\tA-100\t30\tIN\tPO-1\n' > "$l"
printf '# sku\tname\tmin\nA-100\tbox-s\t20\nD-700\tpallet\t4\n' > "$i"
. src/lib/stock.sh
[ "$(LEDGER=$l onhand D-700)" = 0 ] || { echo "onhand with no rows: '$(LEDGER=$l onhand D-700)'"; fail=1; }
[ "$(LEDGER=$l ITEMS=$i bash src/report.sh | tail -1)" = 'D-700 pallet 0' ] || { echo "report row for the item"; fail=1; }
err=$(LEDGER=$l ITEMS=$i bash src/lowstock.sh 2>&1 >/dev/null); [ -z "$err" ] || { echo "stderr: $err"; fail=1; }
[ "$(LEDGER=$l ITEMS=$i bash src/lowstock.sh)" = 'D-700 pallet 0/4' ] || { echo "lowstock lists the item"; fail=1; }
rm -f "$l" "$i"; exit $fail

