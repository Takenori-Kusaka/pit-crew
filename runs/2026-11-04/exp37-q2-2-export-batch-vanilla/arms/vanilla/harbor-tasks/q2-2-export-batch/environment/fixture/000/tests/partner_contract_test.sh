#!/bin/bash
# partner/contract: the helpers print a deterministic summary for a known id.
source lib/partner/contract.sh
fail=0
[ "$(partner_contract_merge_0 abc)" = "contract abc: 21 of 88 (online)" ] || { echo "partner contract partner_contract_merge_0"; fail=1; }
[ "$(partner_contract_expire_3 abc)" = "contract abc: 15 of 93 (full)" ] || { echo "partner contract partner_contract_expire_3"; fail=1; }
partner_contract_merge_0 "" 2>/dev/null; [ $? = 2 ] || { echo "partner contract usage"; fail=1; }
exit $fail

