#!/bin/bash
# EXP-21 (card: docs/experiments/EXP-20261102-21-structure-volume-and-placement.md)
set -u -o pipefail
cd /mnt/e/Github/pit-crew
S=suites/structure/suite.yaml
D=runs/2026-11-02
mem() { free -g | awk '/^Mem:/{print $7}'; }
need() { m=$(mem); echo "$(date +%H:%M) free ${m}G"; if [ "$m" -lt 6 ]; then echo "free memory < 6G, stop"; exit 1; fi; }
P=path:subjects/dev-structure
need
node packages/pit-wall/src/cli.mjs run $S --runner harbor --cases t1-parallel-start,t2-rename-start,t1-parallel-midway,t1-parallel-rush --out $D/structure-controls-5 2>&1 | tail -1
node packages/pit-wall/src/cli.mjs controls $D/structure-controls-5/results.json $S | tail -1 | tee /tmp/e21-controls.txt
grep -qx "ok" /tmp/e21-controls.txt || { echo "controls not as built, stop"; exit 1; }
for round in 1 2; do
  for a in F M Mall H Mskill; do
    need
    node packages/pit-wall/src/cli.mjs run $S --runner harbor --arms $P/$a@/dev --cases t1-parallel-start,t2-rename-start --trials 5 --model claude-sonnet-5-5 --out $D/exp21-main-$a-r$round 2>&1 | tail -1
  done
done
for a in M F H; do
  need
  node packages/pit-wall/src/cli.mjs run $S --runner harbor --arms $P/$a@/dev --cases t1-parallel-midway,t1-parallel-rush --trials 5 --model claude-sonnet-5-5 --out $D/exp21-entry-$a 2>&1 | tail -1
done
for a in M Mskill; do
  need
  node packages/pit-wall/src/cli.mjs run $S --runner harbor --arms $P/$a@/dev --cases t1-parallel-start,t2-rename-start --trials 5 --model claude-haiku-5-5 --out $D/exp21-haiku-$a 2>&1 | tail -1
done
echo "$(date +%H:%M) EXP-21 done"
