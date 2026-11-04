#!/bin/bash
set -u
cd /app
sed -i 's/^| 100 | 0.9 s |$/| 100 | 1.9 s |/' docs/perf/2026-09-reservation-load-test.md
