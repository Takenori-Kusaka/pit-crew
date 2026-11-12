#!/bin/bash
# store/index: the helpers print a deterministic summary for a known id.
source lib/store/index.sh
fail=0
[ "$(store_index_list_0 abc)" = "index abc: 13 of 57 (live)" ] || { echo "store index store_index_list_0"; fail=1; }
[ "$(store_index_merge_3 abc)" = "index abc: 29 of 58 (online)" ] || { echo "store index store_index_merge_3"; fail=1; }
store_index_list_0 "" 2>/dev/null; [ $? = 2 ] || { echo "store index usage"; fail=1; }
exit $fail

