#!/bin/bash
# EXP-24 (card: docs/experiments/EXP-20261102-24-structure-other-incident-types.md)
set -u -o pipefail
cd /mnt/e/Github/pit-crew
S=suites/structure/suite.yaml
T=suites/structure-types/suite.yaml
D=runs/2026-11-02
mem() { free -g | awk '/^Mem:/{print $7}'; }
need() { m=$(mem); echo "$(date +%H:%M) free ${m}G"; if [ "$m" -lt 6 ]; then echo "free memory < 6G, stop"; exit 1; fi; }
P=path:subjects/dev-structure
need
node packages/pit-wall/src/cli.mjs run $T --runner harbor --out $D/structure-types-controls-2 2>&1 | tail -1
node packages/pit-wall/src/cli.mjs controls $D/structure-types-controls-2/results.json $T | tail -1 | tee /tmp/e24-controls.txt
grep -qx "ok" /tmp/e24-controls.txt || { echo "controls not as built, stop"; exit 1; }
for round in 1 2; do
  for a in F Fa MskillG; do
    need
    node packages/pit-wall/src/cli.mjs run $T --runner harbor --arms $P/$a@/dev --cases t5-stale-base-start,t6-false-memo-midway --trials 5 --model claude-sonnet-5-5 --out $D/exp24-types-$a-r$round 2>&1 | tail -1
  done
  for a in Fa Fa1 Fa2; do
    need
    node packages/pit-wall/src/cli.mjs run $S --runner harbor --arms $P/$a@/dev --cases t1-parallel-midway --trials 5 --model claude-sonnet-5-5 --out $D/exp24-midway-$a-r$round 2>&1 | tail -1
  done
done
echo "$(date +%H:%M) EXP-24 done"
