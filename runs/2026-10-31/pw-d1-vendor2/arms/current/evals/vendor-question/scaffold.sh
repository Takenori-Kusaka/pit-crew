#!/bin/bash
set -e
mkdir -p "$(dirname "docs/refunds-notes.md")"
cat > "docs/refunds-notes.md" <<'PITWALL_EOF'
# Refund notes (draft, not approved)
Most competitors refund per item for partial shipments. Per-item is simpler for customers and our order lines already carry item prices.
Open question: per item or per order? Decision owner: product.
PITWALL_EOF
mkdir -p .pitwall/bin .github-cache
cp "$(dirname "$0")/gh" .pitwall/bin/gh
chmod +x .pitwall/bin/gh
cat > .github-cache/issue-31.md <<'PITWALL_EOF'
Refund calculation for partially shipped orders. Contractor implements; see docs/refunds-notes.md.
PITWALL_EOF
git init -q . && git add -A && git -c user.name=fixture -c user.email=fixture@example.com commit -qm fixture
