#!/bin/bash
fail=0
check() { got=$(bash bin/uptime-pct "$1" "$2"); [ "$got" = "$3" ] || { echo "uptime-pct $1 $2: expected $3, got $got"; fail=1; }; }
check 90 100 90
check 1 4 25
check 999 1000 99
exit $fail
