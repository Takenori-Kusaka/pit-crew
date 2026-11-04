#!/bin/bash
fail=0
check() { got=$(bash bin/vowels "$1"); [ "$got" = "$2" ] || { echo "vowels $1: expected $2, got $got"; fail=1; }; }
check Apple 2
check sky 0
check AUDIO 4
check Education 5
exit $fail
