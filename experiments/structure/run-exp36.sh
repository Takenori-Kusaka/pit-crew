#!/bin/bash
# EXP-36 (card: docs/experiments/EXP-20261104-36-v5b-process.md): {default, v5b} x 3 cells x 20.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
source experiments/quota.sh || exit 3
source experiments/heavy-lock.sh exp36
D=runs/2026-11-04
dirs=()
run() { # suite case turns
  for a in default v5b; do
    case $a in default) A=path:subjects/dev-structure/MskillD1@/dev;; v5b) A=path:subjects/dev-structure/MskillD1V5b@/dev;; esac
    out=$D/exp36-$2-$a; dirs+=(exp36-$2-$a)
    echo "$(date +%H:%M) free $(free -g | awk '/^Mem:/{print $7}')G"
    node packages/pit-wall/src/cli.mjs run $1 --runner harbor --arms $A --cases $2 --trials 20 --model claude-sonnet-5-5 --max-turns $3 --out $out > $out.log 2>&1; tail -1 $out.log
  done
}
run suites/structure-types/suite.yaml t5-stale-base-weak 12
run suites/heldout-s5/suite.yaml h5-a1 20
run suites/d3/suite.yaml d3-3 40
node experiments/check-complete.mjs $D 20 "${dirs[@]}"
echo "$(date +%H:%M) EXP-36 done"
