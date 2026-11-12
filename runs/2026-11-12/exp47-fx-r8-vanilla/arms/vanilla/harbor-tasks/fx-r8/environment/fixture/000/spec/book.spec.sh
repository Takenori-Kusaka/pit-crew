#!/bin/bash
fail=0
t=$(mktemp); printf '# room\tdate\tstart\tend\twho\n' > "$t"
BOOKINGS=$t bash src/book.sh aoi 2026-01-05 09:00 10:30 x >/dev/null || { echo "book failed"; fail=1; }
grep -q '^# room' "$t" && grep -q '^aoi.2026-01-05.09:00.10:30.x$' "$t" || { echo "booking not appended"; fail=1; }
BOOKINGS=$t bash src/book.sh aoi 2026-01-05 10:00 11:00 y >/dev/null 2>&1; [ $? = 1 ] || { echo "overlap should exit 1"; fail=1; }
rm -f "$t"; exit $fail
