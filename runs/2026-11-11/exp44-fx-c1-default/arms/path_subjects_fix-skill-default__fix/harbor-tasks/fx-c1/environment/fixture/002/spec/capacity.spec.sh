#!/bin/bash
fail=0
t=$(mktemp); printf '# h\n' > "$t"
b() { BOOKINGS=$t bash src/book.sh "$@" >/dev/null 2>&1; }
b aoi 2026-01-05 09:00 10:00 x 4 || { echo "4 people in aoi rejected"; fail=1; }
b aoi 2026-01-05 10:00 11:00 y 5; [ $? = 1 ] || { echo "5 people in aoi should exit 1"; fail=1; }
b aoi 2026-01-05 12:00 13:00 z many; [ $? = 2 ] || { echo "a non-number should exit 2"; fail=1; }
b momiji 2026-01-05 10:00 11:00 z; [ $? = 2 ] || { echo "unknown room should exit 2"; fail=1; }
rm -f "$t"; exit $fail
