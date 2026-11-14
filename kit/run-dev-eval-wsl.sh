#!/bin/bash
# goal 3 (card docs/planning/38-dev-kit-evaluation.md §9): run the Dev evaluation in WSL, one run at a time.
# For each fixture (A = kit/cases/dev, B = kit/cases/dev-invoice): the no-harness arm once, then each harness
# arm. Skips a run whose result already exists. Waits for 6 GB free memory; quota.sh stops at 0.95.
# Usage: bash kit/run-dev-eval-wsl.sh [arm ...]   (default: none default gq-copy v1)
set -u -o pipefail
cd /mnt/e/Github/pit-crew
export CLAUDE_CODE_OAUTH_TOKEN="$(cat ~/.config/pit-wall/oauth-token)"
out=kit/results/dev-eval
mkdir -p "$out"
declare -A HARNESS=([none]=subjects/dev-skill-default [default]=subjects/dev-skill-default [gq-copy]=subjects/ganbari-quest-v0 [v1]=subjects/role-harness-v1 [v1.1]=subjects/role-harness-v1.1)
arms=("$@"); [ ${#arms[@]} -eq 0 ] && arms=(none default gq-copy v1)
for arm in "${arms[@]}"; do
  for fx in dev dev-invoice; do
    res="$out/$arm-$fx.json"
    [ -f "$res" ] && { echo "skip $arm $fx (done)"; continue; }
    source experiments/quota.sh || { echo "stop: quota"; exit 3; }
    waited=0
    while [ "$(free -g | awk '/Mem:/{print $7}')" -lt 6 ]; do
      [ $waited -ge 360 ] && { echo "stop: memory < 6G for 6h"; exit 4; }
      sleep 60; waited=$((waited + 1))
    done
    which=with; [ "$arm" = none ] && which=without
    echo "== $arm $fx $(date +%H:%M)"
    node packages/pit-wall/src/kit/run-delta.mjs --role dev --spec kit/roles/dev.yaml --cases "kit/cases/$fx" \
      --harness "${HARNESS[$arm]}" --entry /dev --model claude-opus-5-5 --runs 1 --arms "$which" --out "$res" \
      > "$out/$arm-$fx.log" 2>&1 || { echo "stop: $arm $fx failed"; tail -3 "$out/$arm-$fx.log"; exit 5; }
    tail -1 "$out/$arm-$fx.log"
  done
done
echo "all done $(date +%H:%M)"
