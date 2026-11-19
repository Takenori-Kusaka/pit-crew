#!/bin/bash
# EXP-46 (card: docs/experiments/EXP-20261112-46-fix-skill-r1.md): the revised default fix skill only,
# on the 12 kept cells x 30 trials, Haiku class. vanilla / v0 come from EXP-45's stored records.
# Resumable: a cell with results.json is skipped.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
source experiments/quota.sh || exit 3
HEAVY_LOCK_WAIT=${HEAVY_LOCK_WAIT:-1} source experiments/heavy-lock.sh exp46
D=${D:-runs/2026-11-12}
TRIALS=${TRIALS:-30}
MODEL=${MODEL:-claude-haiku-5-5}
mapfile -t CELLS < <(node -e "console.log(JSON.parse(require('fs').readFileSync('experiments/fix/sieve.json','utf8')).kept.join('\n'))")
[ ${#CELLS[@]} -gt 0 ] || { echo "no kept cells"; exit 2; }
mkdir -p "$D"
dirs=()
for c in "${CELLS[@]}"; do
  out=$D/exp46-$c-default-r1; dirs+=(exp46-$c-default-r1)
  [ -f "$out/results.json" ] && { echo "skip $out (exists)"; continue; }
  source experiments/quota.sh || exit 3
  sudo -n /usr/local/sbin/pitwall-drop-caches >/dev/null 2>&1 || true
  echo "$(date +%H:%M) $c default-r1 free $(free -g | awk '/^Mem:/{print $7}')G"
  node packages/pit-wall/src/cli.mjs run suites/fix/suite.yaml --runner harbor --arms "path:subjects/fix-skill-default@/fix" --cases "$c" --trials $TRIALS --model "$MODEL" --max-turns 40 --out "$out" > "$out.log" 2>&1; tail -1 "$out.log"
done
node experiments/check-complete.mjs $D $TRIALS "${dirs[@]}"
echo "$(date +%H:%M) EXP-46 done"
