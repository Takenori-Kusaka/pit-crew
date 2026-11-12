#!/bin/bash
fail=0
t=$(mktemp); printf '# h\naoi\t2026-01-01\t10:00\t11:00\tx\n' > "$t"
[ "$(BOOKINGS=$t bash src/remind.sh 2026-01-02)" = 'no bookings: 2026-01-02' ] || { echo "a day without bookings"; fail=1; }
bash src/remind.sh >/dev/null 2>&1; [ $? = 2 ] || { echo "no date should exit 2"; fail=1; }
BOOKINGS=/nonexistent/bookings.tsv bash src/remind.sh 2026-01-01 >/dev/null 2>&1; [ $? = 2 ] || { echo "a missing bookings file should exit 2"; fail=1; }
rm -f "$t"; exit $fail
