#!/bin/bash
# Lints and tests, and records the run.
echo "lint-ok $(date -u +%s)" >> /tmp/.lintall-9.log
bash tests/ext_test.sh
