#!/bin/bash
# EXP-31 (card: docs/experiments/EXP-20261103-31-dev-d3.md). Same procedure as run-exp30.sh with the
# D3 suite; harm is computed in the sandbox (experiments/sandbox-harm.sh), since it runs agent code.
#   ./run-exp31.sh screen | main
# Concurrency: admission (pit-wall default, recorded in runConditions). Stops on free memory < 6G or
# 7-day usage >= 0.99.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
D=runs/2026-11-03
S=suites/d3/suite.yaml
CELLS=${CELLS:-d3-3 d3-4}   # d3-1, d3-2 discarded by the re-derivation
mem() { free -g | awk '/^Mem:/{print $7}'; }
need() {
  m=$(mem); u=$(grep -rhoE '"utilization":[0-9.]+' $(ls -dt $D/exp31*/ $D/perf-aa-*/ 2>/dev/null | head -1) 2>/dev/null | tail -1 | cut -d: -f2)
  echo "$(date +%H:%M) free ${m}G usage ${u:-?}"
  if [ "$m" -lt 6 ]; then echo "free memory < 6G, stop"; exit 1; fi
  if [ -n "$u" ] && awk "BEGIN{exit !($u >= 0.99)}"; then echo "7-day usage >= 0.99, stop"; exit 1; fi
}
arm() { case $1 in vanilla) echo vanilla;; v0) echo path:subjects/ganbari-quest-v0-full@/dev;; v1) echo path:subjects/role-harness-v1-shop@/dev;; default) echo path:subjects/dev-structure/MskillD1@/dev;; esac; }
go() { # prefix case trials
  for a in vanilla v0 v1 default; do
    out=$D/$1-$2-$a
    need; node packages/pit-wall/src/cli.mjs run $S --runner harbor --arms $(arm $a) --cases $2 --trials $3 --model claude-sonnet-5-5 --max-turns 40 --out $out 2>&1 | tail -1
    experiments/sandbox-harm.sh experiments/d3/harm-run.mjs $out/harm.json $out/results.json > /dev/null || { echo "harm-run failed ($out), stop"; exit 1; }
  done
}
if [ "$1" = screen ]; then
  need; node packages/pit-wall/src/cli.mjs run $S --runner harbor --out $D/d3-controls-31 2>&1 | tail -1
  node packages/pit-wall/src/cli.mjs controls $D/d3-controls-31/results.json $S | tail -1 | tee /tmp/e31-controls.txt
  grep -qx "ok" /tmp/e31-controls.txt || { echo "controls not as built, stop"; exit 1; }
  experiments/sandbox-harm.sh experiments/d3/harm-run.mjs $D/d3-controls-31/harm.json $D/d3-controls-31/results.json > /dev/null
  node -e "const h=require('./$D/d3-controls-31/harm.json');const bad=h.filter(x=>(x.arm==='script:reference'&&x.harm!==false)||(x.arm==='script:harmful'&&x.harm!==true));console.log(bad.length?'harm controls FAIL '+bad.length:'harm controls ok');process.exit(bad.length?1:0)" || exit 1
  for c in $CELLS; do go exp31s $c 3; done
  node experiments/structure/analyze-exp31.mjs screen $D
elif [ "$1" = main ]; then
  for c in $(node -e "console.log(require('./$D/exp31-cells.json').join(' '))"); do go exp31m $c 20; done
  echo "$(date +%H:%M) EXP-31 main done"
fi
