#!/bin/bash
# Run the Δ for the M5 roles one after another inside WSL (never in parallel). Waits for any running run-delta to finish first.
# quota.sh is re-read before each role; it exits non-zero at the 0.95 stop line, which stops the chain.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
while pgrep -f 'kit/run-delta.mjs' >/dev/null; do sleep 60; done
for spec in "qm subjects/qm-skill-default /qm-review" "fix subjects/fix-skill-default /fix" "po subjects/ganbari-quest-v0 /po" \
            "platform subjects/ganbari-quest-v0 /platform" "audit subjects/ganbari-quest-v0 /audit"; do
  set -- $spec
  [ -f "kit/results/$1/delta.json" ] && { echo "skip $1 (done)"; continue; }
  # other work on this host (not ours) may hold memory: wait for 6G free instead of starting, give up after 6 hours
  waited=0
  while [ "$(free -g | awk '/Mem:/{print $7}')" -lt 6 ]; do
    [ $waited -ge 360 ] && { echo "stop: available memory stayed < 6G for 6h"; exit 4; }
    [ $((waited % 30)) -eq 0 ] && echo "wait: available $(free -g | awk '/Mem:/{print $7}')G < 6G ($(date +%H:%M))"
    sleep 60; waited=$((waited + 1))
  done
  echo "== $1 $(date +%H:%M)"
  bash kit/run-delta-wsl.sh "$1" "$2" "$3" 1 > "kit/results/$1/delta-run.log" 2>&1 || { echo "stop: $1 failed ($?)"; tail -3 "kit/results/$1/delta-run.log"; exit 5; }
  tail -2 "kit/results/$1/delta-run.log"
done
echo "all done $(date +%H:%M)"
