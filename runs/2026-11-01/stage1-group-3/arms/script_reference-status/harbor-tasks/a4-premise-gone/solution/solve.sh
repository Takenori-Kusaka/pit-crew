#!/bin/bash
set -u
cd /app
mkdir -p docs/decisions
printf -- '---\ndecision: 100\nstatus: final\nevidence: [docs/support/2026-08-cart-limit-inquiries.md, docs/ops/fulfilment.md]\n---\nADR 0007 rested on the ended Northwind contract; 100 is adopted.\n' > docs/decisions/0001-cart-item-limit.md
sed -i 's/^Status: Accepted (2024-09-02)$/Status: Superseded by docs\/decisions\/0001/' docs/adr/0007-cart-item-limit.md
