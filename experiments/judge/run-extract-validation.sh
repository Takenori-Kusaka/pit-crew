#!/bin/bash
# E-series stage 2 (design 23 §5, second edition): validate the format-independent extractor with
# the two open lineages (format invariance over 6 renderings x 3 structures, trivial declarations),
# then the exploratory regrade of the EXP-39/40 runs. Starts ollama (user-local, 127.0.0.1) after
# the memory checks, holds the heavy lock (no Harbor at the same time), stops ollama afterwards.
# Usage (WSL): bash -l experiments/judge/run-extract-validation.sh
set -u -o pipefail
cd "$(dirname "$0")/../.."
O=~/.local/ollama/bin/ollama
export OLLAMA_MODELS=~/.local/ollama/models OLLAMA_HOST=127.0.0.1:11434
sudo -n /usr/local/sbin/pitwall-drop-caches >/dev/null 2>&1 || true; sleep 10  # see run-e-series.sh
AVAIL=$(free -m | awk '/^Mem:/{print $7}')
echo "host available MiB before: $AVAIL"
if [ "$AVAIL" -lt 6144 ]; then echo "less than 6 GiB available: not starting ollama" >&2; exit 2; fi
WINFREE=$(powershell.exe -NoProfile -Command '[int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024)' 2>/dev/null | tr -d '\r')
echo "windows free MiB before: ${WINFREE:-?}"
if [ -n "$WINFREE" ] && [ "$WINFREE" -lt 4096 ]; then echo "less than 4 GiB free on Windows: not starting ollama" >&2; exit 2; fi
HEAVY_LOCK_WAIT=${HEAVY_LOCK_WAIT:-1} source experiments/heavy-lock.sh extract-validation
$O serve > /tmp/ollama-serve.log 2>&1 &
S=$!
trap 'kill $S 2>/dev/null; wait $S 2>/dev/null; echo "ollama stopped"; rm -rf "$HEAVY_LOCK"' EXIT
for i in $(seq 1 30); do curl -s 127.0.0.1:11434/api/version >/dev/null && break; sleep 1; done
D=$(date +%F)
if [ "${1:-}" != "--regrade-only" ]; then
  echo "$(date +%H:%M) validate-extract"
  node experiments/judge/validate-extract.mjs --out=experiments/judge/validate-extract-$D.json 2>&1 | tail -30
  nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader 2>/dev/null
fi
if [ "${1:-}" != "--validate-only" ]; then
  echo "$(date +%H:%M) regrade EXP-39/40 (exploratory)"
  node experiments/judge/regrade-extract-39-40.mjs runs/2026-11-04 --out=experiments/judge/regrade-extract-39-40-$D.json 2>&1 | tail -12
fi
for M in qwen3:8b granite3.3:8b; do curl -s 127.0.0.1:11434/api/generate -d "{\"model\":\"$M\",\"keep_alive\":0}" >/dev/null; done
echo "$(date +%H:%M) done"
