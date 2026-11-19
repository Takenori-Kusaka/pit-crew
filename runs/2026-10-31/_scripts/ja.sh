#!/bin/bash
unset ANTHROPIC_API_KEY
cd /mnt/e/Github/pit-crew
for m in haiku claude-sonnet-5-5; do
  for d in pw-d1-check pw-d1-vendor2; do
    echo "=== $d / $m"
    node packages/pit-wall/src/cli.mjs judge-agree pitwall-out/$d/results.json suites/_examples/evaluator-check/suite.yaml --model $m --out pitwall-out/$d/judge-$m.json 2>/dev/null
  done
done
