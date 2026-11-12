#!/bin/bash
fail=0
t=$(mktemp); printf '# h\n' > "$t"
far=$(date -u -d '+91 days' +%Y-%m-%d); near=$(date -u -d '+89 days' +%Y-%m-%d)
BOOKINGS=$t bash src/book.sh aoi "$far" 10:00 11:00 x >/dev/null 2>&1; [ $? = 2 ] || { echo "91 days ahead was accepted"; fail=1; }
BOOKINGS=$t bash src/book.sh aoi "$near" 10:00 11:00 x >/dev/null 2>&1 || { echo "89 days ahead was rejected"; fail=1; }
rm -f "$t"; exit $fail

