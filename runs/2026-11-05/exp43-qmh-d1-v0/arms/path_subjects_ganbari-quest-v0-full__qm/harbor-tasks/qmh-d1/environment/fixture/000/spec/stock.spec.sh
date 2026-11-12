#!/bin/bash
. src/lib/stock.sh
fail=0
qty_ok 12 || { echo "qty_ok 12"; fail=1; }
! qty_ok 1.5 || { echo "qty_ok 1.5 accepted"; fail=1; }
! qty_ok abc || { echo "qty_ok abc accepted"; fail=1; }
t=$(mktemp); printf '# h\n2026-10-01\tA-100\t30\tIN\tPO-1\n2026-10-02\tA-100\t12\tOUT\tSO-1\n2026-10-02\tB-010\t5\tIN\tPO-2\n' > "$t"
[ "$(LEDGER=$t onhand A-100)" = 18 ] || { echo "onhand A-100"; fail=1; }
[ "$(LEDGER=$t onhand B-010)" = 5 ] || { echo "onhand B-010"; fail=1; }
rm -f "$t"; exit $fail

