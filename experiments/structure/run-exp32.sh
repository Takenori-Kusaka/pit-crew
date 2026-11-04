#!/bin/bash
# EXP-32 (card: docs/experiments/EXP-20261104-32-process-conformance.md): process conformance, 4 arms.
# dev: t4 (24 turns), t5w (12) x 10; held-out: h5-a1 b1 c1 d1 (20) x 10; D3: d3-3 d3-4 (40) x 20.
# For each cell the four arms run one after the other. Harm (auxiliary) for held-out and D3 is
# computed in the sandbox. Stops on free memory < 6G or 7-day usage >= 0.99.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
source experiments/heavy-lock.sh exp32   # one heavy job per host (2026-11-03 memory stop)
D=runs/2026-11-04
mkdir -p $D
mem() { free -g | awk '/^Mem:/{print $7}'; }
need() {
  m=$(mem); u=$(grep -rhoE '"utilization":[0-9.]+' $(ls -dt $D/exp32-*/ runs/2026-11-03/exp31*/ 2>/dev/null | head -1) 2>/dev/null | tail -1 | cut -d: -f2)
  echo "$(date +%H:%M) free ${m}G usage ${u:-?}"
  if [ "$m" -lt 6 ]; then echo "free memory < 6G, stop"; exit 1; fi
  if [ -n "$u" ] && awk "BEGIN{exit !($u >= 0.99)}"; then echo "7-day usage >= 0.99, stop"; exit 1; fi
}
arm() { case $1 in vanilla) echo vanilla;; v0) echo path:subjects/ganbari-quest-v0-full@/dev;; v1) echo path:subjects/role-harness-v1-shop@/dev;; default) echo path:subjects/dev-structure/MskillD1@/dev;; esac; }
one() { # group suite case trials maxturns harmscript
  for a in vanilla v0 v1 default; do
    out=$D/exp32-$1-$3-$a
    need; node packages/pit-wall/src/cli.mjs run $2 --runner harbor --arms $(arm $a) --cases $3 --trials $4 --model claude-sonnet-5-5 --max-turns $5 --out $out 2>&1 | tail -1
    if [ -n "$6" ]; then experiments/sandbox-harm.sh $6 $out/harm.json $out/results.json > /dev/null || echo "harm-run failed ($out) — auxiliary only, continue"; fi
  done
}
one dev suites/structure-big/suite.yaml t4-scatter-big-start 10 24 ""
one dev suites/structure-types/suite.yaml t5-stale-base-weak 10 12 ""
for c in h5-a1 h5-b1 h5-c1 h5-d1; do one heldout suites/heldout-s5/suite.yaml $c 10 20 experiments/heldout-s5/harm-run.mjs; done
for c in d3-3 d3-4; do one d3 suites/d3/suite.yaml $c 20 40 experiments/d3/harm-run.mjs; done
echo "$(date +%H:%M) EXP-32 done"
