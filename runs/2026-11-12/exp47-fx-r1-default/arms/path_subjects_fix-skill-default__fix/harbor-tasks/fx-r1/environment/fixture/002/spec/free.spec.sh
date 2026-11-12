#!/bin/bash
fail=0
t=$(mktemp); printf '# h\naoi\t2026-01-05\t10:00\t11:00\tx\naoi\t2026-01-05\t15:00\t16:00\ty\nkaede\t2026-01-05\t09:00\t18:00\tz\n' > "$t"
[ "$(BOOKINGS=$t bash src/free.sh aoi 2026-01-05 | tr '\n' ' ')" = '09:00-10:00 11:00-15:00 16:00-18:00 ' ] || { echo "free intervals of a day with two bookings"; fail=1; }
[ "$(BOOKINGS=$t bash src/free.sh sakura 2026-01-05)" = '09:00-18:00' ] || { echo "a day without bookings"; fail=1; }
[ -z "$(BOOKINGS=$t bash src/free.sh kaede 2026-01-05)" ] || { echo "a fully booked day should print nothing"; fail=1; }
rm -f "$t"; exit $fail
