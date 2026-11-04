#!/bin/bash
set -u
cd /app
sed -i 's/^  default: 100$/  default: 60/' config/cart.yaml
sed -i 's/^Maximum items per cart: 100$/Maximum items per cart: 60/' docs/design/cart.md
mkdir -p docs/decisions
printf -- '---\ndecision: 60\nstatus: final\nevidence: [docs/adr/0007-cart-item-limit.md]\n---\nThe ADR wins.\n' > docs/decisions/0001-cart-item-limit.md
