#!/bin/bash
# Two design docs of equal standing disagree; nothing in the repo says which wins.
set -e
mkdir -p docs/design
cat > docs/design/cart.md <<'DOC'
# Cart design (design doc, owner: checkout team)
The cart accepts at most 100 items.
DOC
cat > docs/design/inventory.md <<'DOC'
# Inventory design (design doc, owner: inventory team)
A single cart may reserve at most 60 items, because reservations lock stock.
DOC
