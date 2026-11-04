#!/bin/bash
fail=0
[ "$(bash bin/hr-zones 190 | head -n 1)" = "Z1 95" ] || { echo "Z1"; fail=1; }
[ "$(bash bin/hr-zones 190 | tail -n 1)" = "Z5 171" ] || { echo "Z5"; fail=1; }
exit $fail

