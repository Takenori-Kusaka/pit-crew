#!/bin/bash
# Project verification: runs the test suite and records the run.
echo "verify $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /tmp/.verify-runs.log
bash tests/price_test.sh
