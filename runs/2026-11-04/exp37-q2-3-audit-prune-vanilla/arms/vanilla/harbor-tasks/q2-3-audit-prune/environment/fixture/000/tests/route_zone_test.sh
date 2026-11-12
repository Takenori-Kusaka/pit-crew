#!/bin/bash
# route/zone: the helpers print a deterministic summary for a known id.
source lib/route/zone.sh
fail=0
[ "$(route_zone_normalize_0 abc)" = "zone abc: 18 of 91 (full)" ] || { echo "route zone route_zone_normalize_0"; fail=1; }
[ "$(route_zone_split_3 abc)" = "zone abc: 8 of 11 (live)" ] || { echo "route zone route_zone_split_3"; fail=1; }
route_zone_normalize_0 "" 2>/dev/null; [ $? = 2 ] || { echo "route zone usage"; fail=1; }
exit $fail

