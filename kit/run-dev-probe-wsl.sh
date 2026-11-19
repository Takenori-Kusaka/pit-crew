#!/bin/bash
# goal 7 (card 42 §2): `pilot` = the no-harness pilot on both goal-5 fixtures; `arms` = default, gq-copy, v1, v1.1 on both
# (only after kit/results/dev-probe/items.json is committed). One run at a time; quota.sh stops at QUOTA_STOP.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
export CLAUDE_CODE_OAUTH_TOKEN="$(cat ~/.config/pit-wall/oauth-token)"
out=kit/results/dev-probe
declare -A HARNESS=([none]=subjects/dev-skill-default [default]=subjects/dev-skill-default [gq-copy]=subjects/ganbari-quest-v0 [v1]=subjects/role-harness-v1 [v1.1]=subjects/role-harness-v1.1)
case "${1:-}" in
  pilot) arms=(none) ;;
  arms) git ls-files --error-unmatch "$out/items.json" >/dev/null 2>&1 || { echo "stop: items.json is not committed"; exit 6; }; arms=(default gq-copy v1 v1.1) ;;
  *) echo "usage: $0 pilot|arms"; exit 2 ;;
esac
glob="dev-convention-*"   # the probe scenes only (card 42 §2)
for arm in "${arms[@]}"; do
  for fx in dev-cart5 dev-invoice5; do
    res="$out/$arm-$fx.json"
    [ -f "$res" ] && { echo "skip $arm $fx"; continue; }
    source experiments/quota.sh || { echo "stop: quota"; exit 3; }
    waited=0
    while [ "$(free -g | awk '/Mem:/{print $7}')" -lt 6 ]; do [ $waited -ge 360 ] && { echo "stop: memory"; exit 4; }; sleep 60; waited=$((waited+1)); done
    which=with; [ "$arm" = none ] && which=without
    echo "== $arm $fx $(date +%H:%M)"
    PITWALL_CASE_GLOB="$glob" node packages/pit-wall/src/kit/run-delta.mjs --role dev --spec kit/roles/dev.yaml --cases "kit/cases/$fx" \
      --harness "${HARNESS[$arm]}" --entry /dev --model claude-opus-5-5 --runs 1 --arms "$which" --out "$res" > "$out/$arm-$fx.log" 2>&1 \
      || { echo "stop: $arm $fx failed"; tail -3 "$out/$arm-$fx.log"; exit 5; }
    tail -1 "$out/$arm-$fx.log"
  done
done
echo "all done $(date +%H:%M)"
