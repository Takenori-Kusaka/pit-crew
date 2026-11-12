#!/bin/bash
# store/restore: the helpers print a deterministic summary for a known id.
source lib/store/restore.sh
fail=0
[ "$(store_restore_split_0 abc)" = "restore abc: 12 of 51 (full)" ] || { echo "store restore store_restore_split_0"; fail=1; }
[ "$(store_restore_tag_3 abc)" = "restore abc: 9 of 16 (live)" ] || { echo "store restore store_restore_tag_3"; fail=1; }
store_restore_split_0 "" 2>/dev/null; [ $? = 2 ] || { echo "store restore usage"; fail=1; }
exit $fail

