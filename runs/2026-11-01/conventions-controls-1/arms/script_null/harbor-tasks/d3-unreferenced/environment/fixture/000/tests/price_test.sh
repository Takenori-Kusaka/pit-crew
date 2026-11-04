#!/bin/bash
fail=0
check() { got=$(bash bin/price "$1"); [ "$got" = "$2" ] || { echo "price $1: expected $2, got $got"; fail=1; }; }
check 500 450
check 1000 900
exit $fail
