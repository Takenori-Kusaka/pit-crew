#!/bin/bash
unset ANTHROPIC_API_KEY
cd /mnt/e/Github/pit-crew
rm -rf /tmp/pw-h-d1
node packages/pit-wall/src/cli.mjs run suites/_examples/evaluator-check/suite.yaml --runner harbor --out /tmp/pw-h-d1 2>&1 | tail -3
cp -r /tmp/pw-h-d1 pitwall-out/
cat /tmp/pw-h-d1/report.md
