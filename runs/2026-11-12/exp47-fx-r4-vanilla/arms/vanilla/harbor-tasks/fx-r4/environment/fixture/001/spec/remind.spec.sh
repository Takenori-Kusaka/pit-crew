#!/bin/bash
fail=0
t=$(mktemp); printf '# h\naoi\t2026-01-01\t10:00\t11:00\tx\n' > "$t"
BOOKINGS=$t bash src/remind.sh 2026-01-02 2>&1 | grep -q '^no bookings: 2026-01-02$' || { echo "a day without bookings"; fail=1; }
rm -f "$t"; exit $fail
