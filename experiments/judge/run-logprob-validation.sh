#!/bin/bash
# Stage-④ (rule dependence / specificity logprob) validation by construction, CPU only
# (llama-cpp-python, ollama's qwen3:8b GGUF via mmap). Holds the heavy lock (RAM is shared with
# ollama / Harbor), drops caches first. Usage (WSL): bash -l experiments/judge/run-logprob-validation.sh
set -u -o pipefail
cd "$(dirname "$0")/../.."
sudo -n /usr/local/sbin/pitwall-drop-caches >/dev/null 2>&1 || true; sleep 5
AVAIL=$(free -m | awk '/^Mem:/{print $7}'); echo "host available MiB before: $AVAIL"
if [ "$AVAIL" -lt 7168 ]; then echo "less than 7 GiB available: the 8B GGUF needs ~5.5 GiB in RAM; not starting" >&2; exit 2; fi
HEAVY_LOCK_WAIT=${HEAVY_LOCK_WAIT:-1} source experiments/heavy-lock.sh logprob-validation
trap 'rm -rf "$HEAVY_LOCK"' EXIT
echo "$(date +%H:%M) logprob validation start"
node experiments/judge/validate-logprob.mjs 2>&1 | tail -30
echo "$(date +%H:%M) done"
