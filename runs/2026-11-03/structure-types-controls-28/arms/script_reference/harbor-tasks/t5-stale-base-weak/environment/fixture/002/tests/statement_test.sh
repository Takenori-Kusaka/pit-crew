#!/bin/bash
fail=0
[ -n "$(bash lib/statement.sh 1000)" ] || { echo "statement prints nothing"; fail=1; }
exit $fail

