#!/bin/bash
# goal 4 (card 39 §5): run default, gq-copy, v1 and v1.1 on both rebuilt Dev fixtures, one at a time, after the 7-day
# window resets (2026-11-18 12:00 JST). The no-harness arm is the pilot. quota.sh stops at 0.95.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
[ -n "${WAIT_RESET:-}" ] && until [ "$(TZ=Asia/Tokyo date +%Y%m%d%H%M)" -ge 202611181205 ]; do sleep 300; done
export CLAUDE_CODE_OAUTH_TOKEN="$(cat ~/.config/pit-wall/oauth-token)"
out=kit/results/dev-eval-2
declare -A HARNESS=([default]=subjects/dev-skill-default [gq-copy]=subjects/ganbari-quest-v0 [v1]=subjects/role-harness-v1 [v1.1]=subjects/role-harness-v1.1)
for arm in default gq-copy v1 v1.1; do
  for fx in dev dev-invoice; do
    res="$out/$arm-$fx.json"
    [ -f "$res" ] && { echo "skip $arm $fx"; continue; }
    source experiments/quota.sh || { echo "stop: quota"; exit 3; }
    waited=0
    while [ "$(free -g | awk '/Mem:/{print $7}')" -lt 6 ]; do [ $waited -ge 360 ] && { echo "stop: memory"; exit 4; }; sleep 60; waited=$((waited+1)); done
    echo "== $arm $fx $(date +%H:%M)"
    node packages/pit-wall/src/kit/run-delta.mjs --role dev --spec kit/roles/dev.yaml --cases "kit/cases/$fx" \
      --harness "${HARNESS[$arm]}" --entry /dev --model claude-opus-5-5 --runs 1 --arms with --out "$res" > "$out/$arm-$fx.log" 2>&1 \
      || { echo "stop: $arm $fx failed"; tail -3 "$out/$arm-$fx.log"; exit 5; }
    tail -1 "$out/$arm-$fx.log"
  done
done
echo "all done $(date +%H:%M)"
