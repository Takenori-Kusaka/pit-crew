#!/bin/bash
fail=0
f=$(mktemp)
out=$(BOOKINGS=$f bash bin/book A 0900 1000 standup)
[ "$out" = "booked A 0900-1000" ] || { echo "book output"; fail=1; }
[ "$(wc -l < "$f")" -eq 1 ] || { echo "book appends"; fail=1; }
rm -f "$f"
exit $fail

