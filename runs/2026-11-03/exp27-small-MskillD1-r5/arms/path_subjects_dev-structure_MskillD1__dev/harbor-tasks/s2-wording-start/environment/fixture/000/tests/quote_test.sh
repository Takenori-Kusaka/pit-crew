#!/bin/bash
fail=0
[ "$(bash bin/quote 1000)" = "quote: 900" ] || { echo "quote 1000"; fail=1; }
exit $fail

