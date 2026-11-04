#!/bin/bash
# EXP-35 (card: docs/experiments/EXP-20261104-35-v5b-noninferiority.md): jobsel x {default, v5b} x 10.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
source experiments/heavy-lock.sh exp35
D=runs/2026-11-04
dirs=()
for c in js-1a js-1b js-2a js-2b; do
  for a in default v5b; do
    case $a in default) A=path:subjects/dev-structure/MskillD1@/dev;; v5b) A=path:subjects/dev-structure/MskillD1V5b@/dev;; esac
    out=$D/exp35-$c-$a; dirs+=(exp35-$c-$a)
    echo "$(date +%H:%M) free $(free -g | awk '/^Mem:/{print $7}')G"
    node packages/pit-wall/src/cli.mjs run suites/jobsel/suite.yaml --runner harbor --arms $A --cases $c --trials 10 --model claude-sonnet-5-5 --max-turns 20 --out $out > $out.log 2>&1; tail -1 $out.log
  done
done
node experiments/check-complete.mjs $D 10 "${dirs[@]}"
echo "$(date +%H:%M) EXP-35 done"
