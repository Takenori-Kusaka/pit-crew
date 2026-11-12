#!/bin/bash
fail=0
t=$(mktemp); printf '# h\n2024-12-31\taoi\t09:00\t10:00\tx\n2025-01-01\taoi\t09:00\t10:00\ty\n' > "$t"
before=$(cat "$t")
out=$(ARCHIVE=$t bash tools/purge-archive --dry-run) || { echo "dry-run failed"; fail=1; }
[ "$(printf '%s\n' "$out" | tail -1)" = "dry-run: 2 row(s) would be purged from $t" ] || { echo "dry-run summary: $out"; fail=1; }
[ "$(cat "$t")" = "$before" ] || { echo "dry-run wrote to the archive"; fail=1; }
rm -f "$t"; exit $fail

