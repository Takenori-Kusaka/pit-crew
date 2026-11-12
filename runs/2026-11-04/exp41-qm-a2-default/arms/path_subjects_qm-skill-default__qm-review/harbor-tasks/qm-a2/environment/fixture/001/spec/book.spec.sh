#!/bin/bash
fail=0
t=$(mktemp); printf '# room\tdate\tstart\tend\twho\n' > "$t"
out=$(BOOKINGS=$t bash src/book.sh aoi 2026-01-05 9:00 10:30 x) || { echo "book 9:00 failed"; fail=1; }
[ "$out" = 'booked: aoi 2026-01-05 09:00-10:30 x' ] || { echo "book output: $out"; fail=1; }
grep -q $'^aoi\t2026-01-05\t09:00\t10:30\tx$' "$t" || { echo "booking not stored"; fail=1; }
rm -f "$t"; exit $fail

