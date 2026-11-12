#!/bin/bash
# move.sh SKU QTY KIND REF: record a stock movement (KIND = IN or OUT). An OUT may not exceed the on-hand quantity.
set -u
. "$(dirname "$0")/lib/stock.sh"
TODAY=${TODAY:-$(date -u +%Y-%m-%d)}
sku=$1 qty=$2 kind=$3 ref=$4
qty_ok "$qty" || { echo "quantity must be a whole number: $qty" >&2; exit 2; }
case "$kind" in IN|OUT) ;; *) echo "kind must be IN or OUT: $kind" >&2; exit 2 ;; esac
if [ "$kind" = OUT ]; then
  have=$(onhand "$sku")
  [ "$qty" -le "$have" ] || { echo "insufficient: $sku has $have, asked for $qty" >&2; exit 1; } # equal is allowed (decision 0001)
fi
printf '%s\t%s\t%s\t%s\t%s\n' "$TODAY" "$sku" "$qty" "$kind" "$ref" >> "$LEDGER"
echo "recorded: $kind $qty $sku ($ref)"

