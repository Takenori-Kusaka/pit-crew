#!/bin/bash
# Runs every test and records the run.
echo "verify $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /tmp/.verify-runs.log
s=0; for t in tests/*_test.sh; do bash "$t" || s=1; done; exit $s
