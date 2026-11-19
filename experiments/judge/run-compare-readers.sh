#!/bin/bash
# Reader comparison (local qwen3:8b vs TypeSafe Jev) on the same decision points. GPU for the local
# reader; Jev over the network (key in ~/.config/pit-wall/typesafe-api-key, never printed).
# Usage (WSL): bash -l experiments/judge/run-compare-readers.sh [--n=30] [--k=4]
set -u -o pipefail
cd "$(dirname "$0")/../.."
O=~/.local/ollama/bin/ollama
export OLLAMA_MODELS=~/.local/ollama/models OLLAMA_HOST=127.0.0.1:11434
sudo -n /usr/local/sbin/pitwall-drop-caches >/dev/null 2>&1 || true; sleep 10
AVAIL=$(free -m | awk '/^Mem:/{print $7}'); echo "host available MiB before: $AVAIL"
if [ "$AVAIL" -lt 6144 ]; then echo "less than 6 GiB available: not starting ollama" >&2; exit 2; fi
HEAVY_LOCK_WAIT=${HEAVY_LOCK_WAIT:-1} source experiments/heavy-lock.sh compare-readers
$O serve > /tmp/ollama-serve.log 2>&1 &
S=$!
trap 'kill $S 2>/dev/null; wait $S 2>/dev/null; echo "ollama stopped"; rm -rf "$HEAVY_LOCK"' EXIT
for i in $(seq 1 30); do curl -s 127.0.0.1:11434/api/version >/dev/null && break; sleep 1; done
echo "$(date +%H:%M) compare readers $*"
node experiments/judge/compare-readers.mjs "$@" 2>&1 | sed 's/sk-[A-Za-z0-9_-]*/sk-***/g'
curl -s 127.0.0.1:11434/api/generate -d '{"model":"qwen3:8b","keep_alive":0}' >/dev/null
echo "$(date +%H:%M) done"
