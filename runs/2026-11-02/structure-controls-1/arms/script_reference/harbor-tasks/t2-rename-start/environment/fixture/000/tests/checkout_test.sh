#!/bin/bash
fail=0
[ -n "$(bash bin/checkout 1000)" ] || { echo "checkout prints nothing"; fail=1; }
exit $fail
