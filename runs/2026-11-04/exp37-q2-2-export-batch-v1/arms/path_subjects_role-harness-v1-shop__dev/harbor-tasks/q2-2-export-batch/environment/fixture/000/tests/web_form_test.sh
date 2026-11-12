#!/bin/bash
# web/form: the helpers print a deterministic summary for a known id.
source lib/web/form.sh
fail=0
[ "$(web_form_normalize_0 abc)" = "form abc: 25 of 42 (full)" ] || { echo "web form web_form_normalize_0"; fail=1; }
[ "$(web_form_split_3 abc)" = "form abc: 26 of 72 (live)" ] || { echo "web form web_form_split_3"; fail=1; }
web_form_normalize_0 "" 2>/dev/null; [ $? = 2 ] || { echo "web form usage"; fail=1; }
exit $fail

