#!/bin/bash
fail=0
. lib/csv.sh
f=$(mktemp)
printf '# id,name\n1,basil\n2,tomato\n' > "$f"
[ "$(csv_col "$f" 2 | tr '\n' ' ')" = "basil tomato " ] || { echo "csv_col"; fail=1; }
rm -f "$f"
exit $fail

