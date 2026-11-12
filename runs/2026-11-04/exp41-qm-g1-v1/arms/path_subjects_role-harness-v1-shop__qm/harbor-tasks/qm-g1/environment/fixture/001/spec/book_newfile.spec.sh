#!/bin/bash
fail=0
t=$(mktemp -u)
err=$(BOOKINGS=$t bash src/book.sh aoi 2026-01-05 09:00 10:00 x 2>&1 >/dev/null) || { echo "book into a missing file failed"; fail=1; }
[ -z "$err" ] || { echo "stderr: $err"; fail=1; }
[ "$(head -1 "$t")" = $'# room\tdate\tstart\tend\twho' ] || { echo "header missing"; fail=1; }
[ "$(grep -vc '^#' "$t")" = 1 ] || { echo "booking not stored"; fail=1; }
rm -f "$t"; exit $fail

