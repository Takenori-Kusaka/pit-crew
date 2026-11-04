#!/bin/bash
fail=0
[ "$(bash bin/next-bus 0600)" = "0610" ] || { echo "next-bus 0600"; fail=1; }
[ "$(bash bin/next-bus 2240)" = "2240" ] || { echo "next-bus 2240"; fail=1; }
exit $fail

