#!/bin/bash
fail=0
[ "$(bash bin/price 1000)" = 900 ] || { echo "price 1000"; fail=1; }
exit $fail

