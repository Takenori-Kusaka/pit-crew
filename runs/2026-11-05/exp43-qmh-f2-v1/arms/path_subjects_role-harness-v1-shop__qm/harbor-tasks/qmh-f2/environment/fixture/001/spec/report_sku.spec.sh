#!/bin/bash
fail=0
l=$(mktemp); i=$(mktemp)
printf '# h\n2026-10-01\tA-100\t30\tIN\tPO-1\n2026-10-02\tB-010\t5\tIN\tPO-2\n' > "$l"
printf '# sku\tname\tmin\nB-010\ttape\t8\nA-100\tbox-s\t20\n' > "$i"
[ "$(LEDGER=$l ITEMS=$i bash src/report.sh --sku B-010)" = 'B-010 tape 5' ] || { echo "report --sku"; fail=1; }
[ "$(LEDGER=$l ITEMS=$i bash src/report.sh)" = $'A-100 box-s 30\nB-010 tape 5' ] || { echo "report unchanged"; fail=1; }
LEDGER=$l ITEMS=$i bash src/report.sh --sku Z-999 >/dev/null 2>&1; [ $? = 2 ] || { echo "unknown sku should exit 2"; fail=1; }
rm -f "$l" "$i"; exit $fail

