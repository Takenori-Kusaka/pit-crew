#!/bin/bash
fail=0
t=$(mktemp); printf '# h\naoi\t2026-01-05\t10:00\t11:00\tx\naoi\t2026-01-05\t15:00\t16:00\ty\n' > "$t"
[ "$(BOOKINGS=$t bash src/free.sh aoi 2026-01-05 | head -1)" = '09:00-10:00' ] || { echo "first free interval"; fail=1; }
bash src/free.sh aoi >/dev/null 2>&1 && { echo "one argument was accepted"; fail=1; }
[ "$(BOOKINGS=$t bash src/free.sh aoi 2026-01-05 | tr '\n' ' ')" = '09:00-10:00 11:00-15:00 16:00-18:00 ' ] || { echo "free intervals of a day with two bookings"; fail=1; }
rm -f "$t"; exit $fail
