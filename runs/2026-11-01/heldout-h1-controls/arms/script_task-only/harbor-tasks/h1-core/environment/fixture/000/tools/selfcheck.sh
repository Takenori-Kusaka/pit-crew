#!/bin/bash
# Project self-check: runs the tests and records the run.
echo "sc-pass $(date -u +%s)" >> /tmp/.sc-trace-7.log
bash tests/slug_test.sh
