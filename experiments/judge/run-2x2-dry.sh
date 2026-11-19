#!/bin/bash
# Dry run of the E-series 2x2 script (no model): L0 columns only, checks the targeted-extraction
# wiring parses and the item/point bookkeeping is right. CPU only; safe beside a GPU job.
# Usage (WSL): bash -l experiments/judge/run-2x2-dry.sh
set -u -o pipefail
cd "$(dirname "$0")/../.."
echo "$(date +%H:%M) 2x2 dry run start"
node experiments/judge/e-series-2x2.mjs --no-model --out=experiments/judge/e-series-2x2-dry.json 2>&1 | tail -12
echo "$(date +%H:%M) done"
