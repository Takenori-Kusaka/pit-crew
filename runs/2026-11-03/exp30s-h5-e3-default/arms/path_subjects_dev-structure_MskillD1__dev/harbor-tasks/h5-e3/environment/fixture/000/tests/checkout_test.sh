#!/bin/bash
fail=0
f=$(mktemp)
out=$(LOANS=$f bash bin/checkout DMM-3 test 2026-11-01)
[ "$out" = "checked out DMM-3 to test" ] || { echo "checkout output"; fail=1; }
[ "$(wc -l < "$f")" -eq 1 ] || { echo "checkout appends"; fail=1; }
rm -f "$f"
exit $fail

