#!/bin/bash
# goal 4 (card 39 §2-3): the no-harness pilot on both rebuilt Dev fixtures, one at a time. quota.sh stops at 0.95.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
export CLAUDE_CODE_OAUTH_TOKEN="$(cat ~/.config/pit-wall/oauth-token)"
out=kit/results/dev-eval-2
for fx in dev dev-invoice; do
  res="$out/none-$fx.json"
  [ -f "$res" ] && { echo "skip $fx"; continue; }
  source experiments/quota.sh || { echo "stop: quota"; exit 3; }
  echo "== none $fx $(date +%H:%M)"
  node packages/pit-wall/src/kit/run-delta.mjs --role dev --spec kit/roles/dev.yaml --cases "kit/cases/$fx" \
    --harness subjects/dev-skill-default --model claude-opus-5-5 --runs 1 --arms without --out "$res" > "$out/none-$fx.log" 2>&1 \
    || { echo "stop: $fx failed"; tail -3 "$out/none-$fx.log"; exit 5; }
  tail -1 "$out/none-$fx.log"
done
echo "all done $(date +%H:%M)"
