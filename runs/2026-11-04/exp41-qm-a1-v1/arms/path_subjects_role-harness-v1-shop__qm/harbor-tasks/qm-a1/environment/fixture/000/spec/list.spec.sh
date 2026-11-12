#!/bin/bash
fail=0
t=$(mktemp); printf '# room\tdate\tstart\tend\twho\naoi\t2026-01-02\t10:00\t11:00\tx\nkaede\t2026-01-01\t09:00\t10:00\ty\n' > "$t"
[ "$(BOOKINGS=$t bash src/list.sh | head -1)" = '2026-01-01 09:00-10:00 kaede y' ] || { echo "list sorted"; fail=1; }
[ "$(BOOKINGS=$t bash src/list.sh 2026-01-02)" = '2026-01-02 10:00-11:00 aoi x' ] || { echo "list by date"; fail=1; }
rm -f "$t"; exit $fail

