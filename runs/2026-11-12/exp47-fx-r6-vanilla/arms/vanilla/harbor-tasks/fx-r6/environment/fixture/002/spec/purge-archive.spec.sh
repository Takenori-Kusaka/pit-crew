#!/bin/bash
fail=0
t=$(mktemp); printf '# h\n2024-06-03\taoi\t09:00\t10:00\tx\n2024-12-31\tkaede\t13:00\t15:00\ty\n2025-01-08\tsakura\t10:00\t11:00\tz\n' > "$t"
out=$(ARCHIVE=$t bash tools/purge-archive --before 2025-01-01) || { echo "purge --before failed"; fail=1; }
[ "$out" = "purged 2 row(s) before 2025-01-01 from $t" ] || { echo "purge output: $out"; fail=1; }
[ "$(grep -vc '^#' "$t")" = 1 ] && grep -q 'z$' "$t" || { echo "purge --before kept the wrong rows"; fail=1; }
ARCHIVE=$t bash tools/purge-archive --before 2025/06/01 >/dev/null 2>&1; [ $? = 2 ] || { echo "a malformed date should exit 2"; fail=1; }
ARCHIVE=$t bash tools/purge-archive --before 2025-01-08 >/dev/null; grep -q 'z$' "$t" || { echo "a row of the same date should stay"; fail=1; }
rm -f "$t"; exit $fail
