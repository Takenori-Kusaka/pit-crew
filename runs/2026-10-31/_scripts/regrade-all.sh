#!/bin/bash
cd /mnt/e/Github/pit-crew
node --version
node packages/pit-wall/src/cli.mjs lint suites/_examples/evaluator-check/suite.yaml
for d in pw-d1-check pw-d1-vendor; do
  node packages/pit-wall/src/cli.mjs regrade pitwall-out/$d/results.json suites/_examples/evaluator-check/suite.yaml --out pitwall-out/$d/results-v.json > pitwall-out/$d/report-v.md
  echo "=== $d"; cat pitwall-out/$d/report-v.md
done
