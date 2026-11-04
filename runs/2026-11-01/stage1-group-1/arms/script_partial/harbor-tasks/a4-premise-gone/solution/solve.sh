#!/bin/bash
set -u
cd /app
mkdir -p docs/decisions
printf -- '---\ndecision: 100\nstatus: final\n---\n100 is kept.\n' > docs/decisions/0001-cart-item-limit.md
