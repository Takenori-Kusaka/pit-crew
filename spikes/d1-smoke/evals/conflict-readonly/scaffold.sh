#!/bin/bash
# Seed the workspace: two documents that disagree on the cart limit (ADR outranks design doc).
set -e
mkdir -p docs/design docs/adr
cat > docs/design/cart.md <<'DOC'
# Cart design (design doc)
The cart accepts at most 100 items.
DOC
cat > docs/adr/0007-cart-limit.md <<'DOC'
# ADR-0007: Cart limit (status: accepted)
Decision: the cart accepts at most 50 items, to protect checkout latency.
DOC
