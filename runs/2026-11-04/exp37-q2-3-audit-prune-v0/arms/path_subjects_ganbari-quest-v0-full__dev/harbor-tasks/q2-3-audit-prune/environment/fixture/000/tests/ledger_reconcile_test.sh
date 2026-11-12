#!/bin/bash
# ledger/reconcile: the helpers print a deterministic summary for a known id.
source lib/ledger/reconcile.sh
fail=0
[ "$(ledger_reconcile_summarize_0 abc)" = "reconcile abc: 11 of 24 (live)" ] || { echo "ledger reconcile ledger_reconcile_summarize_0"; fail=1; }
[ "$(ledger_reconcile_check_3 abc)" = "reconcile abc: 20 of 67 (strict)" ] || { echo "ledger reconcile ledger_reconcile_check_3"; fail=1; }
ledger_reconcile_summarize_0 "" 2>/dev/null; [ $? = 2 ] || { echo "ledger reconcile usage"; fail=1; }
exit $fail

