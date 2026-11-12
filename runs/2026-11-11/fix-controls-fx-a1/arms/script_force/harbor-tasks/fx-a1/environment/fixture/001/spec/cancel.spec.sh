#!/bin/bash
fail=0
t=$(mktemp); printf '# room\tdate\tstart\tend\twho\naoi\t2026-01-05\t09:00\t10:00\tx\nkaede\t2026-01-05\t13:00\t14:00\ty\n' > "$t"
out=$(BOOKINGS=$t bash src/cancel.sh aoi 2026-01-05 09:00) || { echo "cancel failed"; fail=1; }
[ "$out" = 'cancelled: aoi 2026-01-05 09:00-10:00 x' ] || { echo "cancel output: $out"; fail=1; }
! grep -q '^aoi.2026-01-05.09:00' "$t" || { echo "booking still there"; fail=1; }
BOOKINGS=$t bash src/cancel.sh aoi 2026-01-05 11:00 >/dev/null 2>&1; [ $? = 1 ] || { echo "not found should exit 1"; fail=1; }
rm -f "$t"; exit $fail
