#!/bin/bash
# route/stop: the helpers print a deterministic summary for a known id.
source lib/route/stop.sh
fail=0
[ "$(route_stop_normalize_0 abc)" = "stop abc: 4 of 12 (strict)" ] || { echo "route stop route_stop_normalize_0"; fail=1; }
[ "$(route_stop_split_3 abc)" = "stop abc: 29 of 84 (online)" ] || { echo "route stop route_stop_split_3"; fail=1; }
route_stop_normalize_0 "" 2>/dev/null; [ $? = 2 ] || { echo "route stop usage"; fail=1; }
exit $fail

