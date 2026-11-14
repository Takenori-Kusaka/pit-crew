#!/bin/bash
# Run the kit's with/without Δ for one role inside WSL. Usage: bash kit/run-delta-wsl.sh <role> <harness dir> <entry> [runs] [case glob]
set -u -o pipefail
cd /mnt/e/Github/pit-crew
source experiments/quota.sh || exit 3
export CLAUDE_CODE_OAUTH_TOKEN="$(cat ~/.config/pit-wall/oauth-token)"
role=$1 harness=$2 entry=$3 runs=${4:-1} glob=${5:-}
out=kit/results/$role/delta.json
[ -n "$glob" ] && out=kit/results/$role/delta-smoke.json
args=(--role "$role" --harness "$harness" --entry "$entry" --model claude-opus-5-5 --runs "$runs" --out "$out")
[ -n "$glob" ] && export PITWALL_CASE_GLOB="$glob"
node packages/pit-wall/src/kit/run-delta.mjs "${args[@]}"
