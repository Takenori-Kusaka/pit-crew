#!/bin/bash
# EXP-43 (card: docs/experiments/EXP-20261105-43-qm-heldout.md): held-out QM cells x 4 arms x 10.
# Cells = the re-derivation agreement (experiments/qm-heldout/rederive/agreement.json: kept[]).
# Resumable: a cell-arm with results.json is skipped.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
source experiments/quota.sh || exit 3
HEAVY_LOCK_WAIT=${HEAVY_LOCK_WAIT:-1} source experiments/heavy-lock.sh exp43
D=${D:-runs/2026-11-05}
TRIALS=${TRIALS:-10}
mapfile -t CELLS < <(node -e "console.log(JSON.parse(require('fs').readFileSync('experiments/qm-heldout/rederive/agreement.json','utf8')).kept.join('\n'))")
[ ${#CELLS[@]} -gt 0 ] || { echo "no kept cells"; exit 2; }
ship() { case $1 in qmh-h*) return 0;; *) return 1;; esac; }
arm() { # arm cell
  local v0=qm v1=qm def=qm-review
  if ship "$2"; then v0=audit; v1=audit; def=qm-ship; fi
  case $1 in vanilla) echo vanilla;; v0) echo "path:subjects/ganbari-quest-v0-full@/$v0";; v1) echo "path:subjects/role-harness-v1-shop@/$v1";; default) echo "path:subjects/qm-skill-default@/$def";; esac
}
dirs=()
for c in "${CELLS[@]}"; do
  for a in vanilla v0 v1 default; do
    out=$D/exp43-$c-$a; dirs+=(exp43-$c-$a)
    [ -f "$out/results.json" ] && { echo "skip $out (exists)"; continue; }
    source experiments/quota.sh || exit 3
    echo "$(date +%H:%M) $c $a free $(free -g | awk '/^Mem:/{print $7}')G"
    node packages/pit-wall/src/cli.mjs run suites/qm-heldout/suite.yaml --runner harbor --arms "$(arm $a $c)" --cases "$c" --trials $TRIALS --model claude-sonnet-5-5 --max-turns 40 --out "$out" > "$out.log" 2>&1; tail -1 "$out.log"
  done
done
node experiments/check-complete.mjs $D $TRIALS "${dirs[@]}"
echo "$(date +%H:%M) EXP-43 done"
