#!/bin/bash
fail=0
bash src/list.sh 2026/01/01 >/dev/null 2>&1; [ $? = 2 ] || { echo "bad date should exit 2"; fail=1; }
t=$(mktemp); printf '# h\naoi\t2026-01-01\t10:00\t11:00\tx\n' > "$t"
[ "$(BOOKINGS=$t bash src/list.sh 2026-01-01)" = '2026-01-01 10:00-11:00 aoi x' ] || { echo "good date"; fail=1; }
[ "$(BOOKINGS=$t bash src/list.sh)" = '2026-01-01 10:00-11:00 aoi x' ] || { echo "no date"; fail=1; }
rm -f "$t"; exit $fail

