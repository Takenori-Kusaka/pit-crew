#!/bin/bash
# Project lint: syntax-checks the scripts and records the run.
echo "lint $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /tmp/.lint-runs.log
bash -n bin/slugify
