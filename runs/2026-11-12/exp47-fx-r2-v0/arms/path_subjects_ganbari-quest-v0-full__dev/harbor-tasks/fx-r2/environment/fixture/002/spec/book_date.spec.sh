#!/bin/bash
fail=0
t=$(mktemp); printf '# h\n' > "$t"
b() { BOOKINGS=$t bash src/book.sh "$@" >/dev/null 2>&1; }
b aoi 2026/12/01 10:00 11:00 x; [ $? = 2 ] || { echo "slashes should exit 2"; fail=1; }
b aoi 2026-12-08 10:00 11:00 x || { echo "the 8th was rejected"; fail=1; }
b kaede 2026-13-01 10:00 11:00 x; [ $? = 2 ] || { echo "month 13 should exit 2"; fail=1; }
b sakura 2026-10-31 10:00 11:00 x || { echo "the 31st was rejected"; fail=1; }
rm -f "$t"; exit $fail
