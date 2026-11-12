#!/bin/bash
# web/redirect: the helpers print a deterministic summary for a known id.
source lib/web/redirect.sh
fail=0
[ "$(web_redirect_merge_0 abc)" = "redirect abc: 17 of 57 (full)" ] || { echo "web redirect web_redirect_merge_0"; fail=1; }
[ "$(web_redirect_expire_3 abc)" = "redirect abc: 20 of 96 (online)" ] || { echo "web redirect web_redirect_expire_3"; fail=1; }
web_redirect_merge_0 "" 2>/dev/null; [ $? = 2 ] || { echo "web redirect usage"; fail=1; }
exit $fail

