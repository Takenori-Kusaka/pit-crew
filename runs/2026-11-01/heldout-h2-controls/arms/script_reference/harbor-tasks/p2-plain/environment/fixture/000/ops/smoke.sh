#!/bin/bash
# Smoke run: runs the tests and records the run.
echo "smoke $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /tmp/.smoke-runs.log
bash tests/uptime_test.sh
