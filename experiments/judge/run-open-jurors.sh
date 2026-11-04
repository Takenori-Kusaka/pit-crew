#!/bin/bash
# Stage 0c: run the open-model jurors (qwen3:8b, then granite3.3:8b) over the scripted judge
# validation set (planning 23 §5). Starts ollama (user-local, 127.0.0.1 only) after checking
# that the host has at least 6 GiB available, and stops it afterwards. Answers go to
# experiments/judge/validation-cache.json; validate.mjs merges them with the Claude juror's.
# Usage (WSL): bash -l experiments/judge/run-open-jurors.sh [--only R2,S2]
set -u -o pipefail
cd "$(dirname "$0")/../.."
O=~/.local/ollama/bin/ollama
export OLLAMA_MODELS=~/.local/ollama/models OLLAMA_HOST=127.0.0.1:11434
AVAIL=$(free -m | awk '/^Mem:/{print $7}')
echo "host available MiB before: $AVAIL"
if [ "$AVAIL" -lt 6144 ]; then echo "less than 6 GiB available: not starting ollama" >&2; exit 2; fi
# Windows host side too (2026-11-03: WSL had 10 GiB while Windows fell to 1.2 GiB)
WINFREE=$(powershell.exe -NoProfile -Command '[int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024)' 2>/dev/null | tr -d '\r')
echo "windows free MiB before: ${WINFREE:-?}"
if [ -n "$WINFREE" ] && [ "$WINFREE" -lt 4096 ]; then echo "less than 4 GiB free on Windows: not starting ollama" >&2; exit 2; fi
# one heavy job per host: not while a Harbor run holds the lock
source experiments/heavy-lock.sh open-jurors
$O serve > /tmp/ollama-serve.log 2>&1 &
S=$!
trap 'kill $S 2>/dev/null; wait $S 2>/dev/null; echo "ollama stopped"; rm -rf "$HEAVY_LOCK"' EXIT
for i in $(seq 1 30); do curl -s 127.0.0.1:11434/api/version >/dev/null && break; sleep 1; done
for J in qwen granite; do
  node packages/pit-wall/src/graders/process/judge/validate.mjs --jurors $J "$@"
  nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader
  free -m | awk '/^Mem:/{print "host available MiB during", $7}'
  # unload before the next model (one 8B model fits the 8 GiB GPU at a time)
  curl -s 127.0.0.1:11434/api/generate -d "{\"model\":\"$( [ $J = qwen ] && echo qwen3:8b || echo granite3.3:8b )\",\"keep_alive\":0}" >/dev/null
done
