#!/bin/bash
# prune: a dry run on an empty root exits 0 and removes nothing.
fail=0
d=$(mktemp -d)
RELAY_ROOT=$d bash bin/prune --dry-run >/dev/null || { echo "prune dry-run"; fail=1; }
rm -rf "$d"
exit $fail

