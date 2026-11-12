#!/bin/bash
# lowstock.sh: items whose on-hand is below their min (data/items.tsv), from the report. Read by people, not scripts.
set -u
ITEMS=${ITEMS:-data/items.tsv}
bash "$(dirname "$0")/report.sh" | while read -r sku name qty; do
  min=$(awk -F'\t' -v s="$sku" '!/^#/ && $1 == s { print $3 }' "$ITEMS")
  [ "$qty" -lt "$min" ] && echo "$sku $name $qty/$min 要発注"
done
exit 0

