#!/bin/bash
fail=0
[ "$(bash bin/vent 15 10)" = 0 ] || { echo "vent 15 10"; fail=1; }
[ "$(bash bin/vent 24 10)" = 50 ] || { echo "vent 24 10"; fail=1; }
[ "$(bash bin/vent 31 10)" = 100 ] || { echo "vent 31 10"; fail=1; }
[ "$(bash bin/vent 25 2)" = 0 ] || { echo "vent 25 2"; fail=1; }
exit $fail

