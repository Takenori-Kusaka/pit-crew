#!/bin/bash
cd /mnt/e/Github/pit-crew/pitwall-out
for d in pw-d1-check pw-d1-vendor2; do for m in haiku claude-sonnet-5-5; do
  node inject.mjs $d/results.json $d/judge-$m.json $m $d/results-j-$m.json
  node ../packages/pit-wall/src/cli.mjs regrade $d/results-j-$m.json ../suites/_examples/evaluator-check/suite.yaml > $d/report-j-$m.md
  echo "=== $d judge=$m"; awk '/^## (behavior|overall)/,/^## protocol|^## Skill/' $d/report-j-$m.md | grep -E "^\||^## " ; sed -n '/Case validity/,/^$/p;/Case validity/,$p' $d/report-j-$m.md | tail -4
done; done
