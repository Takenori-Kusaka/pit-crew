#!/bin/bash
fail=0
t=$(mktemp); printf '# h\n' > "$t"
BOOKINGS=$t bash src/book.sh aoi 2026-01-05 9am 10:00 x >/dev/null 2>&1 && { echo "9am was accepted"; fail=1; }
[ "$(grep -vc '^#' "$t")" = 0 ] || { echo "a rejected booking was stored"; fail=1; }
rm -f "$t"; exit $fail
