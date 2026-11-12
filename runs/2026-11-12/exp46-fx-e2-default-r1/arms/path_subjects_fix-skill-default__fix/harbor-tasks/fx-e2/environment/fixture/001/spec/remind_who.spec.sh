#!/bin/bash
fail=0
t=$(mktemp); printf '# h\naoi\t2026-01-01\t10:00\t11:00\tsato\nkaede\t2026-01-01\t13:00\t14:00\tito\n' > "$t"
[ "$(BOOKINGS=$t bash src/remind.sh --who sato 2026-01-01)" = 'reminder to sato: aoi 2026-01-01 10:00-11:00' ] || { echo "remind --who"; fail=1; }
bash src/remind.sh >/dev/null 2>&1; [ $? = 2 ] || { echo "no date should exit 2"; fail=1; }
rm -f "$t"; exit $fail
