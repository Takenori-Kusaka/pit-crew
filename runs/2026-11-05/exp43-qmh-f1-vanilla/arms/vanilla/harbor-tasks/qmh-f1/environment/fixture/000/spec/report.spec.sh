#!/bin/bash
fail=0
l=$(mktemp); i=$(mktemp)
printf '# h\n2026-10-01\tA-100\t30\tIN\tPO-1\n2026-10-02\tA-100\t12\tOUT\tSO-1\n2026-10-02\tB-010\t5\tIN\tPO-2\n' > "$l"
printf '# sku\tname\tmin\nB-010\ttape\t8\nA-100\tbox-s\t20\n' > "$i"
[ "$(LEDGER=$l ITEMS=$i bash src/report.sh)" = $'A-100 box-s 18\nB-010 tape 5' ] || { echo "report"; fail=1; }
[ "$(LEDGER=$l ITEMS=$i bash src/lowstock.sh)" = $'A-100 box-s 18/20\nB-010 tape 5/8' ] || { echo "lowstock"; fail=1; }
rm -f "$l" "$i"; exit $fail

