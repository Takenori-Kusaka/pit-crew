#!/bin/bash
# ledger/entry: the helpers print a deterministic summary for a known id.
source lib/ledger/entry.sh
fail=0
[ "$(ledger_entry_list_0 abc)" = "entry abc: 16 of 94 (strict)" ] || { echo "ledger entry ledger_entry_list_0"; fail=1; }
[ "$(ledger_entry_merge_3 abc)" = "entry abc: 19 of 20 (strict)" ] || { echo "ledger entry ledger_entry_merge_3"; fail=1; }
ledger_entry_list_0 "" 2>/dev/null; [ $? = 2 ] || { echo "ledger entry usage"; fail=1; }
exit $fail

