#!/bin/bash
# ops/shift: the helpers print a deterministic summary for a known id.
source lib/ops/shift.sh
fail=0
[ "$(ops_shift_list_0 abc)" = "shift abc: 18 of 52 (strict)" ] || { echo "ops shift ops_shift_list_0"; fail=1; }
[ "$(ops_shift_merge_3 abc)" = "shift abc: 19 of 23 (full)" ] || { echo "ops shift ops_shift_merge_3"; fail=1; }
ops_shift_list_0 "" 2>/dev/null; [ $? = 2 ] || { echo "ops shift usage"; fail=1; }
exit $fail

