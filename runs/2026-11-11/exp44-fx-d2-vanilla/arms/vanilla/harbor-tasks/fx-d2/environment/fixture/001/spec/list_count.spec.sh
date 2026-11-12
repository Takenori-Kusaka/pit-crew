#!/bin/bash
fail=0
t=$(mktemp); printf '# h\naoi\t2026-01-01\t10:00\t11:00\tx\nkaede\t2026-01-01\t09:00\t10:00\ty\n' > "$t"
[ "$(BOOKINGS=$t bash src/list.sh --count 2026-01-01)" = 2 ] || { echo "count of a day"; fail=1; }
[ "$(BOOKINGS=$t bash src/list.sh --count 2026-01-02)" = 0 ] || { echo "count of a day without bookings"; fail=1; }
rm -f "$t"; exit $fail
