#!/bin/bash
fail=0
[ "$(bash bin/overdue 10 8)" = "on time" ] || { echo "overdue 10 8"; fail=1; }
[ "$(bash bin/overdue 10 13)" = "overdue 3 days" ] || { echo "overdue 10 13"; fail=1; }
exit $fail

