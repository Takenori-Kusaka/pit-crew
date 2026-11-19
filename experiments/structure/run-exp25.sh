#!/bin/bash
# EXP-25 (card: docs/experiments/EXP-20261102-25-rule-content.md)
set -u -o pipefail
cd /mnt/e/Github/pit-crew
B=suites/structure-big/suite.yaml
T=suites/structure-types/suite.yaml
D=runs/2026-11-02
mem() { free -g | awk '/^Mem:/{print $7}'; }
need() { m=$(mem); echo "$(date +%H:%M) free ${m}G"; if [ "$m" -lt 6 ]; then echo "free memory < 6G, stop"; exit 1; fi; }
P=path:subjects/dev-structure
need
node packages/pit-wall/src/cli.mjs run $T --runner harbor --out $D/structure-types-controls-3 2>&1 | tail -1
node packages/pit-wall/src/cli.mjs controls $D/structure-types-controls-3/results.json $T | tail -1 | tee /tmp/e25-controls.txt
grep -qx "ok" /tmp/e25-controls.txt || { echo "controls not as built, stop"; exit 1; }
for round in 1 2; do
  for a in MskillG MskillR; do
    need
    node packages/pit-wall/src/cli.mjs run $B --runner harbor --arms $P/$a@/dev --cases t4-scatter-big-start --trials 5 --model claude-sonnet-5-5 --max-turns 24 --out $D/exp25-big-$a-r$round 2>&1 | tail -1
  done
  for a in F MskillG MskillR; do
    need
    node packages/pit-wall/src/cli.mjs run $T --runner harbor --arms $P/$a@/dev --cases t5-stale-base-weak --trials 5 --model claude-sonnet-5-5 --out $D/exp25-weak-$a-r$round 2>&1 | tail -1
  done
done
echo "$(date +%H:%M) EXP-25 done"
