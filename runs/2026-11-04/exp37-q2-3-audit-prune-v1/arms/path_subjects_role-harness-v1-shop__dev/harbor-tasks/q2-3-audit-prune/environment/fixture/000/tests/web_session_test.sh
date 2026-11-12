#!/bin/bash
# web/session: the helpers print a deterministic summary for a known id.
source lib/web/session.sh
fail=0
[ "$(web_session_split_0 abc)" = "session abc: 20 of 61 (live)" ] || { echo "web session web_session_split_0"; fail=1; }
[ "$(web_session_tag_3 abc)" = "session abc: 29 of 48 (strict)" ] || { echo "web session web_session_tag_3"; fail=1; }
web_session_split_0 "" 2>/dev/null; [ $? = 2 ] || { echo "web session usage"; fail=1; }
exit $fail

