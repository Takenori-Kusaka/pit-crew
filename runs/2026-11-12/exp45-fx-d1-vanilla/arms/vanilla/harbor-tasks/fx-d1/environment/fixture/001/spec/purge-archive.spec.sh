#!/bin/bash
fail=0
t=$(mktemp); printf '# h\n2024-12-31\taoi\t09:00\t10:00\tx\n2025-01-02\taoi\t09:00\t10:00\ty\n' > "$t"
out=$(ARCHIVE=$t bash tools/purge-archive --before 2025-01-01) || { echo "purge --before failed"; fail=1; }
[ "$out" = "purged 1 row(s) before 2025-01-01 from $t" ] || { echo "purge output: $out"; fail=1; }
[ "$(grep -vc '^#' "$t")" = 1 ] && grep -q 'y$' "$t" || { echo "purge --before kept the wrong rows"; fail=1; }
rm -f "$t"; exit $fail
