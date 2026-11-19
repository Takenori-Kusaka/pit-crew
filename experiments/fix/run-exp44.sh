#!/bin/bash
# EXP-44 (card: docs/experiments/EXP-20261111-44-fix-sieve.md): kept fix cells x 3 arms x 5 trials, Haiku class.
# Cells come from the re-derivation agreement (experiments/fix/rederive/agreement.json: summary.keptIds).
# Resumable: a cell-arm with results.json is skipped. Page cache is dropped per cell-arm.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
source experiments/quota.sh || exit 3
HEAVY_LOCK_WAIT=${HEAVY_LOCK_WAIT:-1} source experiments/heavy-lock.sh exp44
D=${D:-runs/2026-11-11}
TRIALS=${TRIALS:-5}
MODEL=${MODEL:-claude-haiku-5-5}
mapfile -t CELLS < <(node -e "console.log(JSON.parse(require('fs').readFileSync('experiments/fix/rederive/agreement.json','utf8')).summary.keptIds.join('\n'))")
[ ${#CELLS[@]} -gt 0 ] || { echo "no kept cells"; exit 2; }
arm() { case $1 in vanilla) echo vanilla;; v0) echo "path:subjects/ganbari-quest-v0-full@/dev";; default) echo "path:subjects/fix-skill-default@/fix";; esac; }
mkdir -p "$D"
dirs=()
for c in "${CELLS[@]}"; do
  for a in vanilla v0 default; do
    out=$D/exp44-$c-$a; dirs+=(exp44-$c-$a)
    [ -f "$out/results.json" ] && { echo "skip $out (exists)"; continue; }
    source experiments/quota.sh || exit 3
    sudo -n /usr/local/sbin/pitwall-drop-caches >/dev/null 2>&1 || true
    echo "$(date +%H:%M) $c $a free $(free -g | awk '/^Mem:/{print $7}')G"
    node packages/pit-wall/src/cli.mjs run suites/fix/suite.yaml --runner harbor --arms "$(arm $a)" --cases "$c" --trials $TRIALS --model "$MODEL" --max-turns 40 --out "$out" > "$out.log" 2>&1; tail -1 "$out.log"
  done
done
node experiments/check-complete.mjs $D $TRIALS "${dirs[@]}"
echo "$(date +%H:%M) EXP-44 done"
