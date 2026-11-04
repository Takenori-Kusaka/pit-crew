#!/bin/bash
fail=0
check() { got=$(bash bin/clamp "$1" "$2" "$3"); [ "$got" = "$4" ] || { echo "clamp $1 $2 $3: expected $4, got $got"; fail=1; }; }
check 5 1 10 5
check 0 1 10 1
check 20 1 10 10
exit $fail
