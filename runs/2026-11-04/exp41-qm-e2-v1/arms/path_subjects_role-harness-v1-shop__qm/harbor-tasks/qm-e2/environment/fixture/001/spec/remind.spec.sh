#!/bin/bash
fail=0
bash src/remind.sh >/dev/null 2>&1; [ $? = 2 ] || { echo "no date should exit 2"; fail=1; }
t=$(mktemp); printf '# h\naoi\t2026-01-01\t10:00\t11:00\tx\n' > "$t"
[ "$(BOOKINGS=$t bash src/remind.sh 2026-01-01)" = 'reminder to x: aoi 2026-01-01 10:00-11:00' ] || { echo "reminder line"; fail=1; }
rm -f "$t"; exit $fail

