#!/bin/bash
# ops/checklist: the helpers print a deterministic summary for a known id.
source lib/ops/checklist.sh
fail=0
[ "$(ops_checklist_summarize_0 abc)" = "checklist abc: 4 of 22 (full)" ] || { echo "ops checklist ops_checklist_summarize_0"; fail=1; }
[ "$(ops_checklist_check_3 abc)" = "checklist abc: 12 of 13 (online)" ] || { echo "ops checklist ops_checklist_check_3"; fail=1; }
ops_checklist_summarize_0 "" 2>/dev/null; [ $? = 2 ] || { echo "ops checklist usage"; fail=1; }
exit $fail

