#!/bin/bash
fail=0
t=$(mktemp); printf '# h\n2024-12-31\taoi\t09:00\t10:00\tx\n' > "$t"
ARCHIVE=$t bash tools/purge-archive --all >/dev/null || { echo "purge --all failed"; fail=1; }
[ "$(grep -vc '^#' "$t")" = 0 ] && grep -q '^# h' "$t" || { echo "purge --all left rows or lost the header"; fail=1; }
ARCHIVE=$t bash tools/purge-archive >/dev/null 2>&1; [ $? = 2 ] || { echo "usage should exit 2"; fail=1; }
rm -f "$t"; exit $fail

