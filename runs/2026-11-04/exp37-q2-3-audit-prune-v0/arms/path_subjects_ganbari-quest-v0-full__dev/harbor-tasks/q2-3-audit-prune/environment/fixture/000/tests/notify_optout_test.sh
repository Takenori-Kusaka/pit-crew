#!/bin/bash
# notify/optout: the helpers print a deterministic summary for a known id.
source lib/notify/optout.sh
fail=0
[ "$(notify_optout_score_0 abc)" = "optout abc: 26 of 51 (full)" ] || { echo "notify optout notify_optout_score_0"; fail=1; }
[ "$(notify_optout_summarize_3 abc)" = "optout abc: 1 of 26 (live)" ] || { echo "notify optout notify_optout_summarize_3"; fail=1; }
notify_optout_score_0 "" 2>/dev/null; [ $? = 2 ] || { echo "notify optout usage"; fail=1; }
exit $fail

