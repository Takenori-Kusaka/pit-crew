#!/bin/bash
# notify/template: the helpers print a deterministic summary for a known id.
source lib/notify/template.sh
fail=0
[ "$(notify_template_merge_0 abc)" = "template abc: 27 of 67 (full)" ] || { echo "notify template notify_template_merge_0"; fail=1; }
[ "$(notify_template_expire_3 abc)" = "template abc: 21 of 83 (live)" ] || { echo "notify template notify_template_expire_3"; fail=1; }
notify_template_merge_0 "" 2>/dev/null; [ $? = 2 ] || { echo "notify template usage"; fail=1; }
exit $fail

