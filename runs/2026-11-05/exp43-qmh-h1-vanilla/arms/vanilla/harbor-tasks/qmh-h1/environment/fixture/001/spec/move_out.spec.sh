#!/bin/bash
fail=0
t=$(mktemp); printf '# h\n2026-11-01\tB-010\t5\tIN\tPO-9\n' > "$t"
LEDGER=$t bash src/move.sh B-010 6 OUT SO-1 >/dev/null 2>&1; [ $? = 1 ] || { echo "6 of 5 accepted"; fail=1; }
LEDGER=$t bash src/move.sh B-010 5 OUT SO-2 >/dev/null 2>&1 || { echo "5 of 5 refused"; fail=1; }
[ "$(grep -vc '^#' "$t")" = 2 ] || { echo "ledger rows: $(grep -vc '^#' "$t")"; fail=1; }
rm -f "$t"; exit $fail

