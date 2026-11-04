#!/bin/bash
# Before the stage 5 card's main run: (1) Harbor controls of the held-out cells (heldout-s5) and of
# the v1 load probe (preflight-v1); (2) the probe with the v1 arm (2 runs, expect the adapter value)
# and vanilla (1 run, expect NOT LOADED). Both directions, inside the container.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
D=runs/2026-11-03
mem() { free -g | awk '/^Mem:/{print $7}'; }
need() { m=$(mem); echo "$(date +%H:%M) free ${m}G"; if [ "$m" -lt 6 ]; then echo "free memory < 6G, stop"; exit 1; fi; }
for s in suites/heldout-s5/suite.yaml suites/preflight-v1/suite.yaml; do
  n=$(basename $(dirname $s))
  need; node packages/pit-wall/src/cli.mjs run $s --runner harbor --out $D/$n-controls-29 2>&1 | tail -1
  node packages/pit-wall/src/cli.mjs controls $D/$n-controls-29/results.json $s | tail -1
done
node experiments/heldout-s5/harm-run.mjs --out $D/heldout-s5-controls-29/harm.json $D/heldout-s5-controls-29/results.json | tail -3
need; node packages/pit-wall/src/cli.mjs run suites/preflight-v1/suite.yaml --runner harbor --arms path:subjects/role-harness-v1-shop --trials 2 --model claude-sonnet-5-5 --max-turns 6 --out $D/exp29pre-v1 2>&1 | tail -1
need; node packages/pit-wall/src/cli.mjs run suites/preflight-v1/suite.yaml --runner harbor --arms vanilla --trials 1 --model claude-sonnet-5-5 --max-turns 6 --out $D/exp29pre-vanilla 2>&1 | tail -1
echo "$(date +%H:%M) EXP-29 preflight done"
