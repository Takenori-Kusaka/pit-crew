#!/bin/bash
fail=0
t=$(mktemp); printf '# h\n' > "$t"
LEDGER=$t bash src/move.sh A-100 0 IN PO-1 >/dev/null 2>&1; [ $? = 2 ] || { echo "0 accepted"; fail=1; }
LEDGER=$t bash src/move.sh A-100 -3 IN PO-1 >/dev/null 2>&1; [ $? = 2 ] || { echo "-3 accepted"; fail=1; }
LEDGER=$t bash src/move.sh A-100 007 IN PO-1 >/dev/null || { echo "007 refused"; fail=1; }
[ "$(grep -vc '^#' "$t")" = 1 ] || { echo "ledger rows: $(grep -vc '^#' "$t")"; fail=1; }
rm -f "$t"; exit $fail

