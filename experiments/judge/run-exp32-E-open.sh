#!/bin/bash
# EXP-32 E series (planning 23 §10 owner decision 2026-11-04): run the two open-model jurors
# (qwen3:8b, then granite3.3:8b) over the S2 sample that score-runs.mjs selects. Same guards as
# run-open-jurors.sh: host free memory >= 6 GiB (WSL and Windows), the host-wide heavy lock before
# ollama starts, ollama stopped afterwards. Answers go to runs/<date>/exp32-E-cache-open.json; the
# Claude juror (run from Windows) writes exp32-E-cache.json; score-runs.mjs reads both.
# Usage (WSL): bash -l experiments/judge/run-exp32-E-open.sh [--runs runs/2026-11-04]
set -u -o pipefail
cd "$(dirname "$0")/../.."
O=~/.local/ollama/bin/ollama
export OLLAMA_MODELS=~/.local/ollama/models OLLAMA_HOST=127.0.0.1:11434
RUNS=runs/2026-11-04
[ "${1:-}" = "--runs" ] && RUNS=$2
AVAIL=$(free -m | awk '/^Mem:/{print $7}')
echo "host available MiB before: $AVAIL"
if [ "$AVAIL" -lt 6144 ]; then echo "less than 6 GiB available: not starting ollama" >&2; exit 2; fi
WINFREE=$(powershell.exe -NoProfile -Command '[int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024)' 2>/dev/null | tr -d '\r')
echo "windows free MiB before: ${WINFREE:-?}"
if [ -n "$WINFREE" ] && [ "$WINFREE" -lt 4096 ]; then echo "less than 4 GiB free on Windows: not starting ollama" >&2; exit 2; fi
source experiments/heavy-lock.sh exp32-E-open
$O serve > /tmp/ollama-serve.log 2>&1 &
S=$!
trap 'kill $S 2>/dev/null; wait $S 2>/dev/null; echo "ollama stopped"; rm -rf "$HEAVY_LOCK"' EXIT
for i in $(seq 1 30); do curl -s 127.0.0.1:11434/api/version >/dev/null && break; sleep 1; done
# Watchdog (the first run, 2026-11-04: Windows free fell 7.6 -> 2.7 GiB and WSL available 10.9 -> 2.7 GiB
# while granite ran; the run was stopped by hand). Every 30 s: WSL available < 2 GiB or Windows free
# < 2.5 GiB twice in a row stops the juror and ollama; the cache keeps the answers so far.
( low=0; while sleep 30; do
    A=$(free -m | awk '/^Mem:/{print $7}'); W=$(powershell.exe -NoProfile -Command '[int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024)' 2>/dev/null | tr -d '\r')
    if [ "$A" -lt 2048 ] || { [ -n "$W" ] && [ "$W" -lt 2560 ]; }; then low=$((low+1)); else low=0; fi
    if [ "$low" -ge 2 ]; then echo "watchdog: WSL available ${A} MiB, Windows free ${W:-?} MiB: stopping"; pkill -f "judge/score-runs.mjs"; kill $S 2>/dev/null; exit 1; fi
  done ) &
WD=$!
trap 'kill $WD 2>/dev/null; kill $S 2>/dev/null; wait $S 2>/dev/null; echo "ollama stopped"; rm -rf "$HEAVY_LOCK"' EXIT
for J in qwen granite; do
  node packages/pit-wall/src/graders/process/judge/score-runs.mjs --runs "$RUNS" --jurors $J --cache "$RUNS/exp32-E-cache-open.json" --no-blind
  nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader
  free -m | awk '/^Mem:/{print "host available MiB during", $7}'
  curl -s 127.0.0.1:11434/api/generate -d "{\"model\":\"$( [ $J = qwen ] && echo qwen3:8b || echo granite3.3:8b )\",\"keep_alive\":0}" >/dev/null
done
