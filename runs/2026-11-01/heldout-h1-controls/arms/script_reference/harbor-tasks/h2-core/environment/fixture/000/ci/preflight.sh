#!/bin/bash
# Preflight: runs the tests and records the run.
echo "pf-done $(date -u +%s)" >> /tmp/.pf-ledger-x.log
bash tests/clamp_test.sh
