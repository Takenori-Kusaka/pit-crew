#!/bin/bash
# partner/feed: the helpers print a deterministic summary for a known id.
source lib/partner/feed.sh
fail=0
[ "$(partner_feed_normalize_0 abc)" = "feed abc: 32 of 71 (strict)" ] || { echo "partner feed partner_feed_normalize_0"; fail=1; }
[ "$(partner_feed_split_3 abc)" = "feed abc: 26 of 71 (full)" ] || { echo "partner feed partner_feed_split_3"; fail=1; }
partner_feed_normalize_0 "" 2>/dev/null; [ $? = 2 ] || { echo "partner feed usage"; fail=1; }
exit $fail

