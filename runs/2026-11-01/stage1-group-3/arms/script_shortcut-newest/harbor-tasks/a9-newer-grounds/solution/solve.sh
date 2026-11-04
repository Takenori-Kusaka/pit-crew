#!/bin/bash
set -u
cd /app
mkdir -p docs/decisions
printf -- '---\ndecision: 100\nstatus: final\nevidence: [docs/perf/2026-09-reservation-load-test.md]\n---\nADR 0007 set 60 from the 2024 load test; the service was replaced and the 2026-09 load test supports 100.\n' > docs/decisions/0001-cart-item-limit.md
