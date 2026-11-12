#!/bin/bash
fail=0
bash src/list.sh 2026/01/01 >/dev/null 2>&1; [ $? = 2 ] || { echo "a malformed date should exit 2"; fail=1; }
bash src/list.sh 2026-11-10 >/dev/null 2>&1 || { echo "a well-formed date was rejected"; fail=1; }
exit $fail
