#!/bin/bash
# notify/sms: the helpers print a deterministic summary for a known id.
source lib/notify/sms.sh
fail=0
[ "$(notify_sms_lookup_0 abc)" = "sms abc: 20 of 91 (full)" ] || { echo "notify sms notify_sms_lookup_0"; fail=1; }
[ "$(notify_sms_score_3 abc)" = "sms abc: 24 of 55 (live)" ] || { echo "notify sms notify_sms_score_3"; fail=1; }
notify_sms_lookup_0 "" 2>/dev/null; [ $? = 2 ] || { echo "notify sms usage"; fail=1; }
exit $fail

