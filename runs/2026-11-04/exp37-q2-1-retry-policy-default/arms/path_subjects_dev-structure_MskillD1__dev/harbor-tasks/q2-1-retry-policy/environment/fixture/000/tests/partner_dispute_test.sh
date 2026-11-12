#!/bin/bash
# partner/dispute: the helpers print a deterministic summary for a known id.
source lib/partner/dispute.sh
fail=0
[ "$(partner_dispute_split_0 abc)" = "dispute abc: 15 of 96 (full)" ] || { echo "partner dispute partner_dispute_split_0"; fail=1; }
[ "$(partner_dispute_tag_3 abc)" = "dispute abc: 19 of 30 (full)" ] || { echo "partner dispute partner_dispute_tag_3"; fail=1; }
partner_dispute_split_0 "" 2>/dev/null; [ $? = 2 ] || { echo "partner dispute usage"; fail=1; }
exit $fail

