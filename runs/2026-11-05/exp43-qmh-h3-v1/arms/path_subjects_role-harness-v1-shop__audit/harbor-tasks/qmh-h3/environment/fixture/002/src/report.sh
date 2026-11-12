#!/bin/bash
# report.sh [--sku SKU]: on-hand per item, one per line "SKU NAME ONHAND", sorted by SKU. src/lowstock.sh reads this.
set -u
. "$(dirname "$0")/lib/stock.sh"
ITEMS=${ITEMS:-data/items.tsv}
only=
if [ "${1:-}" = --sku ]; then only=${2:-}; [ -n "$only" ] || { echo "usage: report.sh [--sku SKU]" >&2; exit 2; }; shift 2; fi
if [ -n "$only" ] && ! awk -F'\t' -v s="$only" '!/^#/ && $1 == s { f = 1 } END { exit !f }' "$ITEMS"; then echo "unknown sku: $only" >&2; exit 2; fi
while IFS=$'\t' read -r sku name min; do
  case "$sku" in '#'*|'') continue ;; esac
  [ -z "$only" ] || [ "$sku" = "$only" ] || continue
  echo "$sku $name $(onhand "$sku")"
done < "$ITEMS" | sort

