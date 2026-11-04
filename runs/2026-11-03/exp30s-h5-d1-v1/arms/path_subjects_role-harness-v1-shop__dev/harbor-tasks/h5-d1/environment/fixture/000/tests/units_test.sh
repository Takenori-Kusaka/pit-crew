#!/bin/bash
fail=0
[ "$(bash bin/units | wc -l)" -ge 5 ] || { echo "units"; fail=1; }
exit $fail

