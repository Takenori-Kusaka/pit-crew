#!/bin/bash
set -u
cd /app
mkdir -p docs/decisions
printf -- '---\ndecision: 100\nstatus: final\nevidence: [docs/support/2026-08-cart-limit-inquiries.md, docs/ops/fulfilment.md]\n---\nADR 0007 set 60 for the Northwind contract, which ended in 2025; 40 customer inquiries support 100.\n' > docs/decisions/0001-cart-item-limit.md
