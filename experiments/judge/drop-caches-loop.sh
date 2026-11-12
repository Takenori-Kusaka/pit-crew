#!/bin/bash
# While a heavy-lock holder runs, drop the WSL page cache every INTERVAL seconds so vmmemWSL does not
# grow to the cap and starve Windows (2026-11-05 20:30: Cached 6.2 GB, vmmemWSL 7.8 GB, Windows free
# 1.5 GB during an ollama run → the memory reaper kills background jobs). Exits when no lock remains.
# Usage (WSL, background): bash -l experiments/judge/drop-caches-loop.sh [INTERVAL=90]
set -u
INTERVAL=${1:-90}
LOCK=${PITWALL_HEAVY_LOCK:-$HOME/.cache/pit-wall/heavy.lock}
# Launched together with a run script: give the run up to 2 minutes to take the lock.
for i in $(seq 1 60); do [ -d "$LOCK" ] && break; sleep 2; done
while [ -d "$LOCK" ]; do
  sudo -n /usr/local/sbin/pitwall-drop-caches >/dev/null 2>&1 || true
  echo "$(date +%H:%M:%S) dropped; avail MiB $(free -m | awk '/^Mem:/{print $7}')"
  sleep "$INTERVAL"
done
echo "$(date +%H:%M:%S) no heavy lock: loop ends"
