#!/bin/bash
# EXP-26 (card: docs/experiments/EXP-20261103-26-rule-delivery.md)
set -u -o pipefail
cd /mnt/e/Github/pit-crew
B=suites/structure-big/suite.yaml
T=suites/structure-types/suite.yaml
D=runs/2026-11-03
mkdir -p $D
mem() { free -g | awk '/^Mem:/{print $7}'; }
need() { m=$(mem); echo "$(date +%H:%M) free ${m}G"; if [ "$m" -lt 6 ]; then echo "free memory < 6G, stop"; exit 1; fi; }
P=path:subjects/dev-structure
need
for s in $B $T; do
  n=$(basename $(dirname $s))
  node packages/pit-wall/src/cli.mjs run $s --runner harbor --out $D/$n-controls-26 2>&1 | tail -1
  node packages/pit-wall/src/cli.mjs controls $D/$n-controls-26/results.json $s | tail -1 | tee /tmp/e26-controls.txt
  grep -qx "ok" /tmp/e26-controls.txt || { echo "controls not as built ($n), stop"; exit 1; }
done
for round in 1 2 3; do
  for a in MskillG MskillD1 MskillD2; do
    need
    node packages/pit-wall/src/cli.mjs run $B --runner harbor --arms $P/$a@/dev --cases t4-scatter-big-start --trials 5 --model claude-sonnet-5-5 --max-turns 24 --out $D/exp26-big-$a-r$round 2>&1 | tail -1
    need
    node packages/pit-wall/src/cli.mjs run $T --runner harbor --arms $P/$a@/dev --cases t5-stale-base-weak --trials 5 --model claude-sonnet-5-5 --out $D/exp26-weak-$a-r$round 2>&1 | tail -1
  done
done
echo "$(date +%H:%M) EXP-26 done"
