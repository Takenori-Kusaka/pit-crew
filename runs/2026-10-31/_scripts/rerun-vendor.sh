#!/bin/bash
cd /mnt/e/Github/pit-crew
rm -rf /tmp/pw-d1-vendor2
node packages/pit-wall/src/cli.mjs run suites/_examples/evaluator-check/suite.yaml --out /tmp/pw-d1-vendor2 --cases vendor-question 2>&1 | tail -5
cp -r /tmp/pw-d1-vendor2 pitwall-out/
cat /tmp/pw-d1-vendor2/report.md
