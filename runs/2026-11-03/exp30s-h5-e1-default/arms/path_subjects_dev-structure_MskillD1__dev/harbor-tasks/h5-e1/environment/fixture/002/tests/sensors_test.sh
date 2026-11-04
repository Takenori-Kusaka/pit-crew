#!/bin/bash
fail=0
f=$(mktemp)
printf 't1,inside,17\nt1,outside,9\nt2,inside,19\n' > "$f"
[ "$(SENSORS=$f bash bin/sensors | tr '\n' ' ')" = "inside 19 outside 9 " ] || { echo "sensors"; fail=1; }
rm -f "$f"
exit $fail

