#!/bin/bash
# Runs every test and records the run.
echo "verify $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /tmp/.verify-runs.log
s=0; n=0
for t in tests/*_test.sh; do n=$(( n + 1 )); bash "$t" >/dev/null 2>&1 || { echo "FAIL $t"; s=1; }; done
echo "verify: $n tests, exit $s"
exit $s

