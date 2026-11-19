#!/bin/bash
# EXP-39 (card: docs/experiments/EXP-20261104-39-design-rule-delivery.md): {default, v6} x 4 cells x 10.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
source experiments/quota.sh || exit 3
HEAVY_LOCK_WAIT=${HEAVY_LOCK_WAIT:-1} source experiments/heavy-lock.sh exp39
D=runs/2026-11-04
dirs=()
run() { # suite case turns
  for a in default v6; do
    case $a in default) A=path:subjects/dev-structure/MskillD1@/dev;; v6) A=path:subjects/dev-structure/MskillD1V6@/dev;; esac
    out=$D/exp39-$2-$a; dirs+=(exp39-$2-$a)
    echo "$(date +%H:%M) free $(free -g | awk '/^Mem:/{print $7}')G"
    node packages/pit-wall/src/cli.mjs run $1 --runner harbor --arms $A --cases $2 --trials 10 --model claude-sonnet-5-5 --max-turns $3 --out $out > $out.log 2>&1; tail -1 $out.log
  done
}
run suites/structure-types/suite.yaml t5-stale-base-weak 12
run suites/heldout-s5/suite.yaml h5-a1 20
run suites/d3/suite.yaml d3-3 40
run suites/jobsel/suite.yaml js-1b 20
node experiments/check-complete.mjs $D 10 "${dirs[@]}"
echo "$(date +%H:%M) EXP-39 done"
