#!/bin/bash
fail=0
[ "$(bash bin/quote 999)" = "quote: 899" ] || { echo "quote 999"; fail=1; }
exit $fail

