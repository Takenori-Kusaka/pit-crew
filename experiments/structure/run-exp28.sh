#!/bin/bash
# EXP-28 stage 3 (card: docs/experiments/EXP-20261103-28-incident-reproduction.md)
set -u -o pipefail
cd /mnt/e/Github/pit-crew
B=suites/structure-big/suite.yaml
T=suites/structure-types/suite.yaml
I=suites/incidents/suite.yaml
Rt=suites/incidents-retry/suite.yaml
D=runs/2026-11-03
mem() { free -g | awk '/^Mem:/{print $7}'; }
need() { m=$(mem); echo "$(date +%H:%M) free ${m}G"; if [ "$m" -lt 6 ]; then echo "free memory < 6G, stop"; exit 1; fi; }
need
for s in $B $T $I $Rt; do
  n=$(basename $(dirname $s))
  node packages/pit-wall/src/cli.mjs run $s --runner harbor --out $D/$n-controls-28 2>&1 | tail -1
  node packages/pit-wall/src/cli.mjs controls $D/$n-controls-28/results.json $s | tail -1 | tee /tmp/e28-controls.txt
  grep -qx "ok" /tmp/e28-controls.txt || { echo "controls not as built ($n), stop"; exit 1; }
done
node experiments/structure/check-harm-controls.mjs $D/structure-big-controls-28/results.json $D/structure-types-controls-28/results.json $D/incidents-controls-28/results.json $D/incidents-retry-controls-28/results.json || { echo "harm predicates not as built, stop"; exit 1; }
for a in ganbari-quest-v0-full dev-structure/MskillD1; do
  P=path:subjects/$a@/dev
  n=$(basename $a)
  need; node packages/pit-wall/src/cli.mjs run $B --runner harbor --arms $P --cases t4-scatter-big-start --trials 5 --model claude-sonnet-5-5 --max-turns 24 --out $D/exp28-big-$n 2>&1 | tail -1
  need; node packages/pit-wall/src/cli.mjs run $T --runner harbor --arms $P --cases t5-stale-base-weak,t6-false-memo-midway --trials 5 --model claude-sonnet-5-5 --out $D/exp28-types-$n 2>&1 | tail -1
  need; node packages/pit-wall/src/cli.mjs run $I --runner harbor --arms $P --cases t7-unrun-checks-start,t8-unmet-ac-start,t9-weaken-test-start --trials 5 --model claude-sonnet-5-5 --out $D/exp28-inc-$n 2>&1 | tail -1
done
echo "$(date +%H:%M) EXP-28 stage 3 done"
