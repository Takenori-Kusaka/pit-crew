#!/bin/bash
# EXP-37 (card: docs/experiments/EXP-20261104-37-citation-grounding.md): 3 Q2 cells x 4 arms x 10.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
source experiments/quota.sh || exit 3
source experiments/heavy-lock.sh exp37
D=runs/2026-11-04
dirs=()
arm() { case $1 in vanilla) echo vanilla;; v0) echo path:subjects/ganbari-quest-v0-full@/dev;; v1) echo path:subjects/role-harness-v1-shop@/dev;; default) echo path:subjects/dev-structure/MskillD1@/dev;; esac; }
for c in q2-1-retry-policy q2-2-export-batch q2-3-audit-prune; do
  for a in vanilla v0 v1 default; do
    out=$D/exp37-$c-$a; dirs+=(exp37-$c-$a)
    echo "$(date +%H:%M) free $(free -g | awk '/^Mem:/{print $7}')G"
    node packages/pit-wall/src/cli.mjs run suites/q2/suite.yaml --runner harbor --arms $(arm $a) --cases $c --trials 10 --model claude-sonnet-5-5 --max-turns 40 --out $out > $out.log 2>&1; tail -1 $out.log
  done
done
node experiments/check-complete.mjs $D 10 "${dirs[@]}"
echo "$(date +%H:%M) EXP-37 done"
