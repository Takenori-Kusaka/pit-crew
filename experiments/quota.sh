#!/bin/bash
# 7-day quota check for heavy jobs (charter: stop at 0.99). The only reading we have is the last
# rate_limit_event an agent run wrote into runs/ (its 7-day utilization). It lags, and it does not
# see what subagents in the operator's own session consume: on 2026-11-04 the Harbor runs showed
# 0.92 while the week's limit was already exhausted and a subagent died mid-task. So the stop
# threshold applied here keeps a margin for that unseen consumption. Both directions are tested
# by experiments/quota.test.sh.
#   source experiments/quota.sh      -> sets QUOTA_UTIL (or "?"); if over, ENDS the sourcing script with
#                                       exit 3 (an interactive shell gets return 3 instead)
#   bash experiments/quota.sh        -> prints the reading
QUOTA_STOP=${QUOTA_STOP:-0.95}
QUOTA_ROOT=${QUOTA_ROOT:-/mnt/e/Github/pit-crew/runs}
# newest run directories first; the first utilization found is the latest reading
QUOTA_UTIL="?"
QUOTA_RESETS=""
# plugin-eval runs (the kit) write their records under /tmp/claude-eval-*, not runs/: read those too,
# newest first across both (2026-11-14: runs/ alone gave 0.5 while the real reading was 0.89)
for d in $(ls -dt "$QUOTA_ROOT"/*/*/ /tmp/claude-eval-*/ 2>/dev/null | head -40); do
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
  # Sourced by a script: end that script here (exit). A bare `return` would only come back to the
  # caller, which then goes on unless it wrote `|| exit` (review 34 §11.B8). Only an interactive
  # shell is returned to, so that sourcing by hand does not close the terminal.
  if [ "${BASH_SOURCE[0]}" != "$0" ]; then case $- in *i*) return 3 ;; esac; fi
  exit 3
fi
