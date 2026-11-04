#!/bin/bash
set -u
cd /app
mkdir -p docs/decisions
printf -- '---\ndecision: 100\nstatus: final\nevidence: [docs/design/cart.md]\n---\nThe newest value wins.\n' > docs/decisions/0001-cart-item-limit.md
