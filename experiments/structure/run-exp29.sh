#!/bin/bash
# EXP-29 stage 5 main run (card: docs/experiments/EXP-20261103-29-harness-comparison.md).
# Cells: R = t4-scatter-big-start, t5-stale-base-weak; H = h5-a1, h5-b1. Arms: vanilla, v0 (GQ copied
# whole), v1 (first generic version, example/shop adapter), default (dev skill default). 20 trials per
# cell x arm. For each cell the four arms run one after the other (no arm runs all at the end).
# Stops on free memory < 6G or 7-day usage >= 0.99 (last rate_limit_event in the latest results).
set -u -o pipefail
cd /mnt/e/Github/pit-crew
D=runs/2026-11-03
mem() { free -g | awk '/^Mem:/{print $7}'; }
need() {
  m=$(mem); u=$(grep -rhoE '"utilization":[0-9.]+' $(ls -dt $D/exp29-*/ $D/exp29pre-*/ 2>/dev/null | head -1) 2>/dev/null | tail -1 | cut -d: -f2)
  echo "$(date +%H:%M) free ${m}G usage ${u:-?}"
  if [ "$m" -lt 6 ]; then echo "free memory < 6G, stop"; exit 1; fi
  if [ -n "$u" ] && awk "BEGIN{exit !($u >= 0.99)}"; then echo "7-day usage >= 0.99, stop"; exit 1; fi
}
arm() { case $1 in vanilla) echo vanilla;; v0) echo path:subjects/ganbari-quest-v0-full@/dev;; v1) echo path:subjects/role-harness-v1-shop@/dev;; default) echo path:subjects/dev-structure/MskillD1@/dev;; esac; }
one() { # group suite case maxturns
  for a in vanilla v0 v1 default; do
    out=$D/exp29-$1-$3-$a
    need; node packages/pit-wall/src/cli.mjs run $2 --runner harbor --arms $(arm $a) --cases $3 --trials 20 --model claude-sonnet-5-5 --max-turns $4 --out $out 2>&1 | tail -1
    if [ $1 = H ]; then node experiments/heldout-s5/harm-run.mjs --out $out/harm.json $out/results.json > /dev/null || { echo "harm-run failed ($out), stop"; exit 1; }; fi
  done
}
one R suites/structure-big/suite.yaml t4-scatter-big-start 24
one R suites/structure-types/suite.yaml t5-stale-base-weak 12
one H suites/heldout-s5/suite.yaml h5-a1 20
one H suites/heldout-s5/suite.yaml h5-b1 20
echo "$(date +%H:%M) EXP-29 done"
