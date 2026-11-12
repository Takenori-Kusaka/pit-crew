#!/bin/bash
# Try a second extraction lineage (design 23 §11 follow-up, 2026-11-05): synthetic invariance with
# --models, then the real-prose probe. Usage (WSL): bash -l experiments/judge/run-lineage-trial.sh qwen3:8b,llama3.1:8b
set -u -o pipefail
cd "$(dirname "$0")/../.."
MODELS=${1:-qwen3:8b,llama3.1:8b}
O=~/.local/ollama/bin/ollama
export OLLAMA_MODELS=~/.local/ollama/models OLLAMA_HOST=127.0.0.1:11434
sudo -n /usr/local/sbin/pitwall-drop-caches >/dev/null 2>&1 || true; sleep 10
AVAIL=$(free -m | awk '/^Mem:/{print $7}'); echo "host available MiB before: $AVAIL"
if [ "$AVAIL" -lt 6144 ]; then echo "less than 6 GiB available: not starting ollama" >&2; exit 2; fi
WINFREE=$(powershell.exe -NoProfile -Command '[int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024)' 2>/dev/null | tr -d '\r'); echo "windows free MiB before: ${WINFREE:-?}"
if [ -n "$WINFREE" ] && [ "$WINFREE" -lt 4096 ]; then echo "less than 4 GiB free on Windows: not starting ollama" >&2; exit 2; fi
HEAVY_LOCK_WAIT=${HEAVY_LOCK_WAIT:-1} source experiments/heavy-lock.sh lineage-trial
$O serve > /tmp/ollama-serve.log 2>&1 &
S=$!
trap 'kill $S 2>/dev/null; wait $S 2>/dev/null; echo "ollama stopped"; rm -rf "$HEAVY_LOCK"' EXIT
for i in $(seq 1 30); do curl -s 127.0.0.1:11434/api/version >/dev/null && break; sleep 1; done
D=$(date +%F); TAG=$(echo "$MODELS" | tr ',:' '_-')
echo "$(date +%H:%M) synthetic invariance with $MODELS"
node experiments/judge/validate-extract.mjs --models="$MODELS" --out=experiments/judge/validate-extract-$D-$TAG.json 2>&1 | tail -6
echo "$(date +%H:%M) real-prose probe (40 texts)"
node experiments/judge/probe-extract-real.mjs --models="$MODELS" --n=40 2>&1 | tail -6
for M in ${MODELS//,/ }; do curl -s 127.0.0.1:11434/api/generate -d "{\"model\":\"$M\",\"keep_alive\":0}" >/dev/null; done
echo "$(date +%H:%M) done"
