#!/bin/bash
# lowstock.sh: items whose on-hand is below their min (data/items.tsv), from the report. Read by people, not scripts.
set -u
ITEMS=${ITEMS:-data/items.tsv}
[ -r "$ITEMS" ] || { echo "items file not found: $ITEMS" >&2; exit 2; }
bash "$(dirname "$0")/report.sh" | while read -r sku name qty; do
  min=$(awk -F'\t' -v s="$sku" '!/^#/ && $1 == s { print $3 }' "$ITEMS")
  [ "$qty" -lt "$min" ] && echo "$sku $name $qty/$min"
done
exit 0

