#!/bin/bash
fail=0
check() { got=$(bash bin/pad "$1" "$2"); [ "$got" = "$3" ] || { echo "pad $1 $2: expected $3, got $got"; fail=1; }; }
check 7 3 007
check 42 5 00042
check 1234 2 1234
exit $fail
