#!/bin/bash
# Pull an ollama model into the user-local store (no GPU work; download only). Usage (WSL):
# bash -l experiments/judge/pull-model.sh llama3.1:8b
set -u -o pipefail
M=${1:?model}
O=~/.local/ollama/bin/ollama
export OLLAMA_MODELS=~/.local/ollama/models OLLAMA_HOST=127.0.0.1:11434
$O serve > /tmp/ollama-pull.log 2>&1 &
S=$!
trap 'kill $S 2>/dev/null; wait $S 2>/dev/null' EXIT
for i in $(seq 1 30); do curl -s 127.0.0.1:11434/api/version >/dev/null && break; sleep 1; done
$O pull "$M" 2>&1 | tail -2
$O list 2>&1 | tail -5
du -sh ~/.local/ollama/models/blobs | tail -1
