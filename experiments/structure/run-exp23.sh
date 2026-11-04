#!/bin/bash
# EXP-23 (card: docs/experiments/EXP-20261102-23-harm-big-and-state-split.md)
set -u -o pipefail
cd /mnt/e/Github/pit-crew
S=suites/structure/suite.yaml
B=suites/structure-big/suite.yaml
D=runs/2026-11-02
mem() { free -g | awk '/^Mem:/{print $7}'; }
need() { m=$(mem); echo "$(date +%H:%M) free ${m}G"; if [ "$m" -lt 6 ]; then echo "free memory < 6G, stop"; exit 1; fi; }
P=path:subjects/dev-structure
need
node experiments/structure/check-t4-size.mjs | tail -1 | tee /tmp/e23-size.txt
grep -qx OK /tmp/e23-size.txt || { echo "big cell size/task check failed, stop"; exit 1; }
node packages/pit-wall/src/cli.mjs run $B --runner harbor --out $D/structure-big-controls-1 2>&1 | tail -1
node packages/pit-wall/src/cli.mjs controls $D/structure-big-controls-1/results.json $B | tail -1 | tee /tmp/e23-controls.txt
grep -qx "ok" /tmp/e23-controls.txt || { echo "controls not as built, stop"; exit 1; }
for round in 1 2; do
  for a in F Fa MskillG; do
    need
    node packages/pit-wall/src/cli.mjs run $B --runner harbor --arms $P/$a@/dev --cases t4-scatter-big-start --trials 5 --model claude-sonnet-5-5 --max-turns 24 --out $D/exp23-big-$a-r$round 2>&1 | tail -1
  done
  for a in Fa1 Fa2; do
    need
    node packages/pit-wall/src/cli.mjs run $S --runner harbor --arms $P/$a@/dev --cases t1-parallel-start,t2-rename-start --trials 5 --model claude-sonnet-5-5 --out $D/exp23-split-$a-r$round 2>&1 | tail -1
  done
done
echo "$(date +%H:%M) EXP-23 done"
