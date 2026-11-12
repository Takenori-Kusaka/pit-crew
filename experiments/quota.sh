#!/bin/bash
# 7-day quota check for heavy jobs (charter: stop at 0.99). The only reading we have is the last
# rate_limit_event an agent run wrote into runs/ (its 7-day utilization). It lags, and it does not
# see what subagents in the operator's own session consume: on 2026-11-04 the Harbor runs showed
# 0.92 while the week's limit was already exhausted and a subagent died mid-task. So the stop
# threshold applied here keeps a margin for that unseen consumption. Both directions are tested
# by experiments/quota.test.sh.
#   source experiments/quota.sh      -> sets QUOTA_UTIL (or "?") and stops the caller if over
#   bash experiments/quota.sh        -> prints the reading
QUOTA_STOP=${QUOTA_STOP:-0.95}
QUOTA_ROOT=${QUOTA_ROOT:-/mnt/e/Github/pit-crew/runs}
# newest run directories first; the first utilization found is the latest reading
QUOTA_UTIL="?"
QUOTA_RESETS=""
for d in $(ls -dt "$QUOTA_ROOT"/*/*/ 2>/dev/null | head -40); do
  u=$(grep -rhoE '"utilization":[0-9.]+' "$d" 2>/dev/null | tail -1 | cut -d: -f2)
  if [ -n "$u" ]; then
    QUOTA_UTIL=$u
    QUOTA_RESETS=$(grep -rhoE '"resetsAt":[0-9]+' "$d" 2>/dev/null | tail -1 | cut -d: -f2)
    break
  fi
done
# A reading taken before the window reset is stale: the window has started over since.
if [ -n "$QUOTA_RESETS" ] && [ "$QUOTA_RESETS" -lt "$(date +%s)" ]; then
  echo "7-day usage: last reading ${QUOTA_UTIL} is from before the reset at $(date -d @"$QUOTA_RESETS" +%F\ %R 2>/dev/null || echo "$QUOTA_RESETS"); treating as unknown"
  QUOTA_UTIL="?"
fi
echo "7-day usage (last reading) ${QUOTA_UTIL}, stop at >= ${QUOTA_STOP}"
if [ "$QUOTA_UTIL" != "?" ] && awk "BEGIN{exit !($QUOTA_UTIL >= $QUOTA_STOP)}"; then
  echo "7-day usage ${QUOTA_UTIL} >= ${QUOTA_STOP}: not starting (write the status and the remaining plan)"
  if [ "${BASH_SOURCE[0]}" != "$0" ]; then return 3 2>/dev/null; fi
  exit 3
fi
