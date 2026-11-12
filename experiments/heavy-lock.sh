#!/bin/bash
# Take the host-wide heavy-job lock (same directory as packages/pit-wall/src/runners/heavy-lock.mjs)
# for the life of the calling shell. Usage in a script: `source experiments/heavy-lock.sh <what>`.
# Stops the script if another live process holds it; takes over a stale lock.
HEAVY_LOCK=${PITWALL_HEAVY_LOCK:-$HOME/.cache/pit-wall/heavy.lock}
mkdir -p "$(dirname "$HEAVY_LOCK")"
# HEAVY_LOCK_WAIT=1: wait (poll every 60 s, up to HEAVY_LOCK_WAIT_MAX seconds, default 6 h) for a live
# holder to finish instead of stopping, so a run can be queued behind a judge run.
waited=0
while ! mkdir "$HEAVY_LOCK" 2>/dev/null; do
  pid=$(cut -f1 "$HEAVY_LOCK/owner" 2>/dev/null)
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    if [ "${HEAVY_LOCK_WAIT:-0}" = "1" ] && [ "$waited" -lt "${HEAVY_LOCK_WAIT_MAX:-21600}" ]; then
      [ "$waited" -eq 0 ] && echo "$(date +%H:%M) waiting for the heavy lock held by: $(cat "$HEAVY_LOCK/owner")"
      sleep "${HEAVY_LOCK_POLL:-60}"; waited=$((waited + ${HEAVY_LOCK_POLL:-60})); continue
    fi
    echo "another heavy job holds $HEAVY_LOCK: $(cat "$HEAVY_LOCK/owner")"; exit 1
  fi
  rm -rf "$HEAVY_LOCK"   # stale: its process is gone; try again
done
[ "$waited" -gt 0 ] && echo "$(date +%H:%M) heavy lock acquired after ${waited}s"
printf '%s\t%s\t%s\n' "$$" "${1:-script}" "$(date -Iseconds)" > "$HEAVY_LOCK/owner"
trap 'rm -rf "$HEAVY_LOCK"' EXIT
export PITWALL_HEAVY_HELD=1   # children (pit-wall runs) run under this lock
# Give the page cache back to Windows before the heavy job (helper installed once by the owner with
# experiments/setup/install-drop-caches.sh). Without the helper, say so and go on: admission and the
# watchdog still guard the run.
if sudo -n /usr/local/sbin/pitwall-drop-caches 2>/dev/null; then
  echo "page cache dropped: $(awk '/^Cached:/{printf "%d MiB cached", $2/1024}' /proc/meminfo)"
  # autoMemoryReclaim=gradual hands the freed memory back over about a minute (measured 2026-11-04:
  # 962 MiB right after the drop, 10562 MiB 90 s later). Wait for it before the admission check.
  sleep 90
else
  echo "page cache not dropped (helper not installed or not allowed)"
fi
