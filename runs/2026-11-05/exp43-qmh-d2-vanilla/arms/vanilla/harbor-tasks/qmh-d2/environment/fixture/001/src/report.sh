#!/bin/bash
# report.sh [--json]: on-hand per item, one per line "SKU NAME ONHAND", sorted by SKU. src/lowstock.sh reads this.
# --json prints the same rows as a JSON array (for the stock dashboard). The plain output is unchanged.
set -u
. "$(dirname "$0")/lib/stock.sh"
ITEMS=${ITEMS:-data/items.tsv}
json=0; [ "${1:-}" = --json ] && json=1
rows() {
  while IFS=$'\t' read -r sku name min; do
    case "$sku" in '#'*|'') continue ;; esac
    echo "$sku $name $(onhand "$sku")"
  done < "$ITEMS" | sort
}
if [ $json = 1 ]; then
  rows | perl -ne 'chomp; my ($s, $n, $q) = split / /; for ($s, $n) { s/(["\\])/\\$1/g } push @r, qq({"sku":"$s","name":"$n","onhand":$q}); END { print "[", join(",", @r), "]\n" }'
else rows; fi

