#!/bin/bash
fail=0
l=$(mktemp); i=$(mktemp)
printf '# h\n2026-10-01\tA-100\t19\tIN\tPO-1\n2026-10-01\tA-200\t10\tIN\tPO-1\n2026-10-01\tB-010\t6\tIN\tPO-2\n' > "$l"
printf '# sku\tname\tmin\nA-100\tbox-s\t20\nA-200\tbox-l\t10\nB-010\ttape\t5\n' > "$i"
[ "$(LEDGER=$l ITEMS=$i bash src/lowstock.sh)" = 'A-100 box-s 19/20' ] || { echo "below the min listed; equal and above not"; fail=1; }
[ -z "$(LEDGER=$l ITEMS=$i bash src/lowstock.sh 2>&1 >/dev/null)" ] || { echo "stderr not empty"; fail=1; }
rm -f "$l" "$i"; exit $fail

