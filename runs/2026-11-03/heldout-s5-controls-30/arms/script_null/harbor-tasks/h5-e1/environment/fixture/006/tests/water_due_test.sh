#!/bin/bash
fail=0
f=$(mktemp)
printf 'T1,20390,3\n' > "$f"
[ "$(BEDS=$f bash bin/water-due T1 20396)" = due ] || { echo "T1 20396"; fail=1; }
[ "$(BEDS=$f bash bin/water-due T1 20410)" = due ] || { echo "T1 20410"; fail=1; }
BEDS=$f bash bin/water-due X9 20396 >/dev/null 2>&1 && { echo "unknown bed accepted"; fail=1; }
rm -f "$f"
exit $fail

