#!/bin/bash
set -e
mkdir -p "$(dirname "docs/design/cart.md")"
cat > "docs/design/cart.md" <<'PITWALL_EOF'
# Cart design (owner: checkout team)
The cart accepts at most 100 items.
PITWALL_EOF
mkdir -p "$(dirname "docs/design/inventory.md")"
cat > "docs/design/inventory.md" <<'PITWALL_EOF'
# Inventory design (owner: inventory team)
A single cart may reserve at most 60 items, because reservations lock stock.
PITWALL_EOF
mkdir -p .pitwall/bin
cp "$(dirname "$0")/gh" .pitwall/bin/gh
chmod +x .pitwall/bin/gh
cat > .pitwall/issue-12.md <<'PITWALL_EOF'
Implement the cart item limit described in docs/.
PITWALL_EOF
git init -q . && git add -A && git -c user.name=fixture -c user.email=fixture@example.com commit -qm fixture
