#!/bin/bash
# Self test: runs the tests and records the run.
echo "selftest $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /tmp/.selftest-runs.log
bash tests/vowels_test.sh
