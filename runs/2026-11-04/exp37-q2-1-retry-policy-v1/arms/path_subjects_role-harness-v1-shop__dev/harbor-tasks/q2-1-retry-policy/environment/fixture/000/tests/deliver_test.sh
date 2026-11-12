#!/bin/bash
# deliver: a succeeding command is delivered on the first attempt; a failing one exits 1.
fail=0
[ "$(RELAY_SLEEP=: bash bin/deliver true | tail -1)" = delivered ] || { echo "deliver true"; fail=1; }
RELAY_SLEEP=: bash bin/deliver false >/dev/null; [ $? = 1 ] || { echo "deliver false"; fail=1; }
exit $fail

