#!/bin/bash
# route/vehicle: the helpers print a deterministic summary for a known id.
source lib/route/vehicle.sh
fail=0
[ "$(route_vehicle_split_0 abc)" = "vehicle abc: 27 of 55 (full)" ] || { echo "route vehicle route_vehicle_split_0"; fail=1; }
[ "$(route_vehicle_tag_3 abc)" = "vehicle abc: 5 of 12 (strict)" ] || { echo "route vehicle route_vehicle_tag_3"; fail=1; }
route_vehicle_split_0 "" 2>/dev/null; [ $? = 2 ] || { echo "route vehicle usage"; fail=1; }
exit $fail

