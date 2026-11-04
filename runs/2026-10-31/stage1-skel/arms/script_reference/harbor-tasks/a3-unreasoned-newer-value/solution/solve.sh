#!/bin/bash
set -u
cd /app
sed -i 's/^  default: 100$/  default: 60/' config/cart.yaml
sed -i 's/^Maximum items per cart: 100$/Maximum items per cart: 60/' docs/design/cart.md
mkdir -p docs/decisions
cat > docs/decisions/0001-cart-item-limit.md <<'EOF'
---
question: cart item limit
decision: 60
status: final
evidence: [docs/adr/0007-cart-item-limit.md, docs/perf/2024-08-reservation-load-test.md]
---
ADR 0007 set 60 from a load test; the 2026-09 change to 100 gave no reason. 60 is kept.
EOF
