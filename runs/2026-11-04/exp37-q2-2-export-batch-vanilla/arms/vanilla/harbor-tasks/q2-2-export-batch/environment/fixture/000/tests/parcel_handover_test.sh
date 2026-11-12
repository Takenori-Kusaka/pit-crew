#!/bin/bash
# parcel/handover: the helpers print a deterministic summary for a known id.
source lib/parcel/handover.sh
fail=0
[ "$(parcel_handover_merge_0 abc)" = "handover abc: 21 of 93 (live)" ] || { echo "parcel handover parcel_handover_merge_0"; fail=1; }
[ "$(parcel_handover_expire_3 abc)" = "handover abc: 13 of 34 (strict)" ] || { echo "parcel handover parcel_handover_expire_3"; fail=1; }
parcel_handover_merge_0 "" 2>/dev/null; [ $? = 2 ] || { echo "parcel handover usage"; fail=1; }
exit $fail

