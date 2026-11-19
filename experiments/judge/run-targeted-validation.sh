#!/bin/bash
# Validate targeted extraction (synthetic oracle) with two lineages, then probe it on the EXP-32
# planted decision points via the 2x2 script. Usage (WSL): bash -l experiments/judge/run-targeted-validation.sh qwen3:8b,llama3.1:8b
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
HEAVY_LOCK_WAIT=${HEAVY_LOCK_WAIT:-1} source experiments/heavy-lock.sh targeted-validation
$O serve > /tmp/ollama-serve.log 2>&1 &
S=$!
trap 'kill $S 2>/dev/null; wait $S 2>/dev/null; echo "ollama stopped"; rm -rf "$HEAVY_LOCK"' EXIT
for i in $(seq 1 30); do curl -s 127.0.0.1:11434/api/version >/dev/null && break; sleep 1; done
D=$(date +%F); TAG=$(echo "$MODELS" | tr ',:' '_-')
echo "$(date +%H:%M) targeted validation with $MODELS"
node experiments/judge/validate-extract-targeted.mjs --models="$MODELS" --out=experiments/judge/validate-extract-targeted-$D-$TAG.json 2>&1 | tail -8
for M in ${MODELS//,/ }; do curl -s 127.0.0.1:11434/api/generate -d "{\"model\":\"$M\",\"keep_alive\":0}" >/dev/null; done
echo "$(date +%H:%M) done"
