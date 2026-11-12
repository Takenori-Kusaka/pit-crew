#!/bin/bash
fail=0
t=$(mktemp); printf '# h\naoi\t2026-01-01\t10:00\t11:00\tx\nkaede\t2026-01-01\t09:00\t10:00\ty\n' > "$t"
[ "$(BOOKINGS=$t bash src/list.sh --room aoi)" = '2026-01-01 10:00-11:00 aoi x' ] || { echo "list --room"; fail=1; }
[ "$(BOOKINGS=$t bash src/list.sh | head -1)" = '2026-01-01 09:00-10:00 kaede y' ] || { echo "list unchanged"; fail=1; }
bash src/list.sh --room >/dev/null 2>&1; [ $? = 2 ] || { echo "--room without a value should exit 2"; fail=1; }
rm -f "$t"; exit $fail
