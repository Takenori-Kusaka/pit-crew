#!/bin/bash
# E series, second edition, on the EXP-32 runs: extraction (model-major, cached) -> structure ->
# reader Δ on a sample. Starts ollama after the memory checks, holds the heavy lock, stops ollama.
# Usage (WSL): bash -l experiments/judge/run-e-series.sh [--reader=N]
set -u -o pipefail
cd "$(dirname "$0")/../.."
O=~/.local/ollama/bin/ollama
export OLLAMA_MODELS=~/.local/ollama/models OLLAMA_HOST=127.0.0.1:11434
# The WSL page cache fills to the 12 GB cap between runs and starves Windows; drop it before the
# memory checks (2026-11-05: three launches refused with "less than 4 GiB free on Windows").
sudo -n /usr/local/sbin/pitwall-drop-caches >/dev/null 2>&1 || true; sleep 10
AVAIL=$(free -m | awk '/^Mem:/{print $7}')
echo "host available MiB before: $AVAIL"
if [ "$AVAIL" -lt 6144 ]; then echo "less than 6 GiB available: not starting ollama" >&2; exit 2; fi
WINFREE=$(powershell.exe -NoProfile -Command '[int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024)' 2>/dev/null | tr -d '\r')
echo "windows free MiB before: ${WINFREE:-?}"
if [ -n "$WINFREE" ] && [ "$WINFREE" -lt 4096 ]; then echo "less than 4 GiB free on Windows: not starting ollama" >&2; exit 2; fi
HEAVY_LOCK_WAIT=${HEAVY_LOCK_WAIT:-1} source experiments/heavy-lock.sh e-series
$O serve > /tmp/ollama-serve.log 2>&1 &
S=$!
trap 'kill $S 2>/dev/null; wait $S 2>/dev/null; echo "ollama stopped"; rm -rf "$HEAVY_LOCK"' EXIT
for i in $(seq 1 30); do curl -s 127.0.0.1:11434/api/version >/dev/null && break; sleep 1; done
D=$(date +%F)
echo "$(date +%H:%M) e-series 2x2 (extraction + structure${1:+ + reader})"
# 2026-11-05 night: targeted extraction, skeleton lineages qwen3:8b + Jev (Noul; llama3.1 marked absent
# options as mentioned on real prose). qwen3 raws are cached; Jev calls go over the network (key file).
node experiments/judge/e-series-2x2.mjs runs/2026-11-04 ${1:-} --out=experiments/judge/e-series-2x2-qwen-jev-$D.json 2>&1 | sed 's/sk-[A-Za-z0-9_-]*/sk-***/g' | tail -24
for M in qwen3:8b; do curl -s 127.0.0.1:11434/api/generate -d "{\"model\":\"$M\",\"keep_alive\":0}" >/dev/null; done
nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader 2>/dev/null
echo "$(date +%H:%M) done"
