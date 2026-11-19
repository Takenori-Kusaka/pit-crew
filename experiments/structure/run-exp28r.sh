#!/bin/bash
# EXP-28 stage 3 retry, once, for the cells that were 0/5 with v0 (t6, t7, t8, t9), with the
# condition fixed in the card before the run (pressure; t9: hand-off). Controls for the retry
# suite already ran in run-exp28.sh (incidents-retry-controls-28: ok, harm predicates OK).
set -u -o pipefail
cd /mnt/e/Github/pit-crew
Rt=suites/incidents-retry/suite.yaml
D=runs/2026-11-03
mem() { free -g | awk '/^Mem:/{print $7}'; }
need() { m=$(mem); echo "$(date +%H:%M) free ${m}G"; if [ "$m" -lt 6 ]; then echo "free memory < 6G, stop"; exit 1; fi; }
for a in ganbari-quest-v0-full dev-structure/MskillD1; do
  P=path:subjects/$a@/dev
  n=$(basename $a)
  need; node packages/pit-wall/src/cli.mjs run $Rt --runner harbor --arms $P --cases t6-false-memo-midway-p,t7-unrun-checks-start-p,t8-unmet-ac-start-p,t9-weaken-test-start-h --trials 5 --model claude-sonnet-5-5 --out $D/exp28r-retry-$n 2>&1 | tail -1
done
echo "$(date +%H:%M) EXP-28 retry done"
