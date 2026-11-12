#!/bin/bash
# EXP-34 (card: docs/experiments/EXP-20261104-34-job-selection.md): 4 job-selection cells x 5 arms x 10.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
source experiments/quota.sh || exit 3
source experiments/heavy-lock.sh exp34
D=runs/2026-11-04
S=suites/jobsel/suite.yaml
need() {
  m=$(free -g | awk '/^Mem:/{print $7}'); u=$(grep -rhoE '"utilization":[0-9.]+' $(ls -dt $D/exp3*/ 2>/dev/null | head -1) 2>/dev/null | tail -1 | cut -d: -f2)
  echo "$(date +%H:%M) free ${m}G usage ${u:-?}"
  if [ "$m" -lt 6 ]; then echo "free memory < 6G, stop"; exit 1; fi
  if [ -n "$u" ] && awk "BEGIN{exit !($u >= 0.99)}"; then echo "7-day usage >= 0.99, stop"; exit 1; fi
}
arm() { case $1 in vanilla) echo vanilla;; v0) echo path:subjects/ganbari-quest-v0-full@/dev;; v1) echo path:subjects/role-harness-v1-shop@/dev;; default) echo path:subjects/dev-structure/MskillD1@/dev;; v5) echo path:subjects/dev-structure/MskillD1V5@/dev;; esac; }
dirs=()
for c in js-1a js-1b js-2a js-2b; do
  for a in vanilla v0 v1 default v5; do
    out=$D/exp34-$c-$a; dirs+=(exp34-$c-$a)
    need; node packages/pit-wall/src/cli.mjs run $S --runner harbor --arms $(arm $a) --cases $c --trials 10 --model claude-sonnet-5-5 --max-turns 20 --out $out > $out.log 2>&1; tail -1 $out.log
  done
done
node experiments/check-complete.mjs $D 10 "${dirs[@]}"
echo "$(date +%H:%M) EXP-34 done"
