#!/bin/bash
# Ledger helpers. LEDGER rows: date<TAB>sku<TAB>qty<TAB>kind<TAB>ref (kind IN or OUT).
LEDGER=${LEDGER:-data/ledger.tsv}
# qty_ok QTY: succeeds when QTY is a whole number.
qty_ok() { [[ $1 =~ ^[0-9]+$ ]]; }
# onhand SKU: units in stock = IN total minus OUT total.
onhand() { awk -F'\t' -v s="$1" '!/^#/ && NF && $2 == s { if ($4 == "IN") t += $3; else t -= $3 } END { print t + 0 }' "$LEDGER"; }

