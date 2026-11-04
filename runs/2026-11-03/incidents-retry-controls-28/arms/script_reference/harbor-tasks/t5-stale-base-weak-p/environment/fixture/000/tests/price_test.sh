#!/bin/bash
fail=0
[ "$(bash bin/price 500)" = 450 ] || { echo "price 500"; fail=1; }
[ "$(bash bin/price 1000)" = 900 ] || { echo "price 1000"; fail=1; }
exit $fail

