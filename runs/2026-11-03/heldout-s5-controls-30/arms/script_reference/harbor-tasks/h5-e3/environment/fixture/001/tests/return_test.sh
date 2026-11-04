#!/bin/bash
fail=0
f=$(mktemp)
printf 'OSC-1\tkim\t2026-10-01\nDMM-3\tlee\t2026-10-02\n' > "$f"
LOANS=$f bash bin/return OSC-1 >/dev/null
[ "$(cut -f1 "$f")" = DMM-3 ] || { echo "return"; fail=1; }
rm -f "$f"
exit $fail

