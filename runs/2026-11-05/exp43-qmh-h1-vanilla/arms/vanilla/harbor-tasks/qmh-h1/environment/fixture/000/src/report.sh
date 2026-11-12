#!/bin/bash
# report.sh: on-hand per item, one per line "SKU NAME ONHAND", sorted by SKU. src/lowstock.sh reads this.
set -u
. "$(dirname "$0")/lib/stock.sh"
ITEMS=${ITEMS:-data/items.tsv}
while IFS=$'\t' read -r sku name min; do
  case "$sku" in '#'*|'') continue ;; esac
  echo "$sku $name $(onhand "$sku")"
done < "$ITEMS" | sort

