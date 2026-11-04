#!/bin/bash
set -u
cd /app
mkdir -p docs/decisions
printf -- '---\ndecision: 100\nstatus: final\nevidence: [docs/perf/2026-09-reservation-load-test.md]\n---\nThe 2026-09 load test supports 100.\n' > docs/decisions/0001-cart-item-limit.md
sed -i 's/^Status: Accepted (2024-09-02)$/Status: Superseded by docs\/decisions\/0001/' docs/adr/0007-cart-item-limit.md
