#!/bin/bash
# EXP-22 (card: docs/experiments/EXP-20261102-22-structure-elements-and-harm.md)
set -u -o pipefail
cd /mnt/e/Github/pit-crew
S=suites/structure/suite.yaml
D=runs/2026-11-02
mem() { free -g | awk '/^Mem:/{print $7}'; }
need() { m=$(mem); echo "$(date +%H:%M) free ${m}G"; if [ "$m" -lt 6 ]; then echo "free memory < 6G, stop"; exit 1; fi; }
P=path:subjects/dev-structure
R() { node packages/pit-wall/src/cli.mjs run $S --runner harbor --arms $P/$1@/dev --cases $2 --trials $3 --model claude-sonnet-5-5 --out $D/$4 2>&1 | tail -1; }
need
node packages/pit-wall/src/cli.mjs run $S --runner harbor --cases t1-parallel-start,t2-rename-start,t3-scatter-start --out $D/structure-controls-6 2>&1 | tail -1
node packages/pit-wall/src/cli.mjs controls $D/structure-controls-6/results.json $S | tail -1 | tee /tmp/e22-controls.txt
grep -qx "ok" /tmp/e22-controls.txt || { echo "controls not as built, stop"; exit 1; }
for round in 1 2; do
  for a in Fa Fb Fc Fd MskillG; do need; R $a t1-parallel-start,t2-rename-start 5 exp22-main-$a-r$round; done
  need; R F t1-parallel-start,t2-rename-start $([ $round = 1 ] && echo 3 || echo 2) exp22-drift-F-r$round
  for a in F MskillG; do need; R $a t3-scatter-start 5 exp22-harm-$a-r$round; done
done
echo "$(date +%H:%M) EXP-22 done"
