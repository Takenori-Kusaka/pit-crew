#!/bin/bash
# Project check: runs the tests and records the run.
echo "check $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /tmp/.check-runs.log
bash tests/pad_test.sh
