#!/bin/bash
fail=0
t=$(mktemp); printf '# h\n' > "$t"
out=$(BOOKINGS=$t bash src/book.sh aoi 2026-01-05 09:00 10:00 x) || { echo "book failed"; fail=1; }
[ "$out" = '予約しました: aoi 2026-01-05 09:00-10:00 x' ] || { echo "message: $out"; fail=1; }
rm -f "$t"; exit $fail

