#!/bin/bash
# EXP-27 (card: docs/experiments/EXP-20261103-27-d1-confirm-small-action.md)
set -u -o pipefail
cd /mnt/e/Github/pit-crew
B=suites/structure-big/suite.yaml
T=suites/structure-types/suite.yaml
S=suites/structure-small/suite.yaml
D=runs/2026-11-03
mem() { free -g | awk '/^Mem:/{print $7}'; }
need() { m=$(mem); echo "$(date +%H:%M) free ${m}G"; if [ "$m" -lt 6 ]; then echo "free memory < 6G, stop"; exit 1; fi; }
P=path:subjects/dev-structure
R() { need; node packages/pit-wall/src/cli.mjs run $1 --runner harbor --arms $P/$2@/dev --cases $3 --trials 5 --model claude-sonnet-5-5 ${5:-} --out $D/$4 2>&1 | tail -1; }
need
for s in $B $T $S; do
  n=$(basename $(dirname $s))
  node packages/pit-wall/src/cli.mjs run $s --runner harbor --out $D/$n-controls-27 2>&1 | tail -1
  node packages/pit-wall/src/cli.mjs controls $D/$n-controls-27/results.json $s | tail -1 | tee /tmp/e27-controls.txt
  grep -qx "ok" /tmp/e27-controls.txt || { echo "controls not as built ($n), stop"; exit 1; }
done
for round in 1 2 3 4 5 6; do
  for a in MskillG MskillD1; do
    R $B $a t4-scatter-big-start exp27-big-$a-r$round "--max-turns 24"
    R $T $a t5-stale-base-weak exp27-weak-$a-r$round
  done
  if [ $round -le 3 ]; then R $T MskillD1A t5-stale-base-weak exp27-act-MskillD1A-r$round; fi
  if [ $round -ge 4 ] && [ $round -le 5 ]; then
    for a in MskillG MskillD1; do R $S $a s1-typo-start,s2-wording-start exp27-small-$a-r$round; done
  fi
done
echo "$(date +%H:%M) EXP-27 done"
