#!/bin/bash
# EXP-33 (card: docs/experiments/EXP-20261104-33-fill-missing.md): only h5-c1 x vanilla x 10.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
source experiments/heavy-lock.sh exp33
D=runs/2026-11-04
out=$D/exp32-heldout-h5-c1-vanilla
rm -rf $out   # the empty directory left by the failed run (no records; arms only)
node packages/pit-wall/src/cli.mjs run suites/heldout-s5/suite.yaml --runner harbor --arms vanilla --cases h5-c1 --trials 10 --model claude-sonnet-5-5 --max-turns 20 --out $out 2>&1 | tee $D/exp33-run.log | tail -3
experiments/sandbox-harm.sh experiments/heldout-s5/harm-run.mjs $out/harm.json $out/results.json > /dev/null || echo "harm-run failed (auxiliary)"
node experiments/check-complete.mjs $D 10 exp32-heldout-h5-c1-vanilla
echo "$(date +%H:%M) EXP-33 done"
