#!/bin/bash
fail=0
[ "$(bash bin/total 1000)" = 990 ] || { echo "total 1000: expected 990, got $(bash bin/total 1000)"; fail=1; }
exit $fail

