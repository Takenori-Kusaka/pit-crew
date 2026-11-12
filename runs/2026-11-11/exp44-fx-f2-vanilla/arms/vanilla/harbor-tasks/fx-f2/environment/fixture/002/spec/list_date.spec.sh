#!/bin/bash
fail=0
bash src/list.sh 2026/01/01 >/dev/null 2>&1; [ $? = 2 ] || { echo "a malformed date should exit 2"; fail=1; }
[ "$(bash src/list.sh 2026/01/01 2>&1 >/dev/null)" = 'bad date: 2026/01/01 (expected YYYY-MM-DD)' ] || { echo "bad date message"; fail=1; }
exit $fail
