#!/bin/bash
# store/snapshot: the helpers print a deterministic summary for a known id.
source lib/store/snapshot.sh
fail=0
[ "$(store_snapshot_merge_0 abc)" = "snapshot abc: 21 of 49 (strict)" ] || { echo "store snapshot store_snapshot_merge_0"; fail=1; }
[ "$(store_snapshot_expire_3 abc)" = "snapshot abc: 21 of 70 (strict)" ] || { echo "store snapshot store_snapshot_expire_3"; fail=1; }
store_snapshot_merge_0 "" 2>/dev/null; [ $? = 2 ] || { echo "store snapshot usage"; fail=1; }
exit $fail

