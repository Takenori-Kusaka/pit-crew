#!/bin/bash
# goal 4 (card 39 §3): rerun only the rebuilt scene (missing-acceptance, 3 wordings) without a harness, both fixtures.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
export CLAUDE_CODE_OAUTH_TOKEN="$(cat ~/.config/pit-wall/oauth-token)"
out=kit/results/dev-eval-2
for fx in dev dev-invoice; do
  res="$out/none-$fx-rebuild.json"
  [ -f "$res" ] && { echo "skip $fx"; continue; }
  source experiments/quota.sh || { echo "stop: quota"; exit 3; }
  echo "== none $fx rebuild $(date +%H:%M)"
  PITWALL_CASE_GLOB='dev-esc-missing-acceptance-*' node packages/pit-wall/src/kit/run-delta.mjs --role dev --spec kit/roles/dev.yaml --cases "kit/cases/$fx" \
    --harness subjects/dev-skill-default --model claude-opus-5-5 --runs 1 --arms without --out "$res" > "$out/none-$fx-rebuild.log" 2>&1 \
    || { echo "stop: $fx failed"; tail -3 "$out/none-$fx-rebuild.log"; exit 5; }
  tail -1 "$out/none-$fx-rebuild.log"
done
echo "all done $(date +%H:%M)"
