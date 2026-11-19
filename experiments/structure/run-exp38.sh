#!/bin/bash
# EXP-38 (card: docs/experiments/EXP-20261104-38-adapter-conformance.md): kept subject-2 cells x {vanilla, default} x 10.
# The cell list comes from verdicts.json at run time (inclusion rule fixed in the card).
set -u -o pipefail
cd /mnt/e/Github/pit-crew
source experiments/quota.sh || exit 3
HEAVY_LOCK_WAIT=${HEAVY_LOCK_WAIT:-1} source experiments/heavy-lock.sh exp38
D=runs/2026-11-04
CELLS=$(node -e "const v=require('./experiments/subject2/verdicts.json');const c=['s2-1','s2-k1','s2-k5','s2-k3b','s2-k4b','s2-k2c'];console.log(c.filter(id=>v.find(x=>x.case===id&&x.keep)).join(' '))")
echo "cells: $CELLS" | tee $D/exp38-cells.txt
dirs=()
for c in $CELLS; do
  for a in vanilla default; do
    case $a in vanilla) A=vanilla;; default) A=path:subjects/dev-structure/MskillD1@/dev;; esac
    out=$D/exp38-$c-$a; dirs+=(exp38-$c-$a)
    echo "$(date +%H:%M) free $(free -g | awk '/^Mem:/{print $7}')G"
    node packages/pit-wall/src/cli.mjs run suites/subject2/suite.yaml --runner harbor --arms $A --cases $c --trials 10 --model claude-sonnet-5-5 --max-turns 20 --out $out > $out.log 2>&1; tail -1 $out.log
  done
done
node experiments/check-complete.mjs $D 10 "${dirs[@]}"
echo "$(date +%H:%M) EXP-38 done"
