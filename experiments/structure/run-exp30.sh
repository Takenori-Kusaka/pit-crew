#!/bin/bash
# EXP-30 (card: docs/experiments/EXP-20261103-30-heldout-generalization.md).
#   ./run-exp30.sh screen : Harbor controls of the suite, harm on the controls, then 8 candidate cells
#                           x 4 arms x 3 trials; screen analysis (pooled over arms) picks the cells.
#   ./run-exp30.sh main   : the chosen cells x 4 arms x 20 trials (fresh trials; screening not reused).
# Stops on free memory < 6G or 7-day usage >= 0.99.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
D=runs/2026-11-03
S=suites/heldout-s5/suite.yaml
mem() { free -g | awk '/^Mem:/{print $7}'; }
need() {
  m=$(mem); u=$(grep -rhoE '"utilization":[0-9.]+' $(ls -dt $D/exp30*/ $D/exp29-*/ 2>/dev/null | head -1) 2>/dev/null | tail -1 | cut -d: -f2)
  echo "$(date +%H:%M) free ${m}G usage ${u:-?}"
  if [ "$m" -lt 6 ]; then echo "free memory < 6G, stop"; exit 1; fi
  if [ -n "$u" ] && awk "BEGIN{exit !($u >= 0.99)}"; then echo "7-day usage >= 0.99, stop"; exit 1; fi
}
arm() { case $1 in vanilla) echo vanilla;; v0) echo path:subjects/ganbari-quest-v0-full@/dev;; v1) echo path:subjects/role-harness-v1-shop@/dev;; default) echo path:subjects/dev-structure/MskillD1@/dev;; esac; }
go() { # prefix case trials
  for a in vanilla v0 v1 default; do
    out=$D/$1-$2-$a
    need; node packages/pit-wall/src/cli.mjs run $S --runner harbor --arms $(arm $a) --cases $2 --trials $3 --model claude-sonnet-5-5 --max-turns 20 --out $out 2>&1 | tail -1
    node experiments/heldout-s5/harm-run.mjs --out $out/harm.json $out/results.json > /dev/null || { echo "harm-run failed ($out), stop"; exit 1; }
  done
}
if [ "$1" = screen ]; then
  need; node packages/pit-wall/src/cli.mjs run $S --runner harbor --out $D/heldout-s5-controls-30 2>&1 | tail -1
  node packages/pit-wall/src/cli.mjs controls $D/heldout-s5-controls-30/results.json $S | tail -1 | tee /tmp/e30-controls.txt
  grep -qx "ok" /tmp/e30-controls.txt || { echo "controls not as built, stop"; exit 1; }
  node experiments/heldout-s5/harm-run.mjs --out $D/heldout-s5-controls-30/harm.json $D/heldout-s5-controls-30/results.json > /dev/null
  node -e "const h=require('./$D/heldout-s5-controls-30/harm.json');const bad=h.filter(x=>(x.arm==='script:reference'&&x.harm!==false)||(x.arm==='script:harmful'&&x.harm!==true));console.log(bad.length?'harm controls FAIL '+bad.length:'harm controls ok');process.exit(bad.length?1:0)" || exit 1
  for c in h5-e1 h5-e3 h5-e4 h5-c1 h5-d1 h5-a2 h5-d2; do go exp30s $c 3; done
  node experiments/structure/analyze-exp30.mjs screen $D
elif [ "$1" = main ]; then
  for c in $(node -e "console.log(require('./$D/exp30-cells.json').join(' '))"); do go exp30m $c 20; done
  echo "$(date +%H:%M) EXP-30 main done"
fi
