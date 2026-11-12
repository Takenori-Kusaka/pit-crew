#!/bin/bash
# ledger/refund: the helpers print a deterministic summary for a known id.
source lib/ledger/refund.sh
fail=0
[ "$(ledger_refund_score_0 abc)" = "refund abc: 24 of 86 (live)" ] || { echo "ledger refund ledger_refund_score_0"; fail=1; }
[ "$(ledger_refund_summarize_3 abc)" = "refund abc: 21 of 70 (strict)" ] || { echo "ledger refund ledger_refund_summarize_3"; fail=1; }
ledger_refund_score_0 "" 2>/dev/null; [ $? = 2 ] || { echo "ledger refund usage"; fail=1; }
exit $fail

