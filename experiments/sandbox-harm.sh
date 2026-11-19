#!/bin/bash
# Run a harm script that executes the agent's final-state code (harmOfDir: swap in an implementation,
# run the tests) inside a throwaway container instead of on the host: no network, a memory limit,
# the repository read-only, a non-root user, and only the output directory writable.
# Usage (WSL): experiments/sandbox-harm.sh <harm-run.mjs> <out harm.json> <results.json> [...]
set -u -o pipefail
REPO=/mnt/e/Github/pit-crew
IMG=${PITWALL_SANDBOX_IMAGE:-pitwall/agent-claude-code:latest}
NODE=$(readlink -f "$(command -v node)")   # the host's node binary, read-only (the agent image has none on PATH)
script=$1; out=$2; shift 2
outdir=$(cd "$(dirname "$out")" && pwd)
docker run --rm --network none --memory 1g --pids-limit 512 --user "$(id -u):$(id -g)" \
  -v "$NODE:/usr/local/bin/node:ro" -e HOME=/tmp -v "$REPO:$REPO:ro" -v "$outdir:/out" -w "$REPO" \
  --entrypoint /usr/local/bin/node "$IMG" "$script" --out "/out/$(basename "$out")" "$@"
