#!/bin/bash
# W0c (#96): waits until WSL has enough available memory, then runs the FIRST step of the probe only:
#   the three scripted controls x 3 of the cell t5-stale-base-weak (no model), then ONE model trial without
#   the harness (Fable 5.2), with the quota line lifted for this one trial.
# Owner decision 2026-11-15 (docs/planning/00-owner-statements.md): the last quota reading (0.99) is from the
# earlier model's runs and is stale; run one trial with the stop line lifted, read the quota again from its
# record, continue only if it is below 0.95.
# After this script ends, read runs/w0c/timing.tsv and `bash experiments/quota.sh`; the rest of the probe is
#   bash -l experiments/w0c/run-w0c.sh        (default line 0.95; the finished trial is kept)
#
#   setsid nohup bash -l experiments/w0c/wait-and-first-trial.sh > runs/w0c/waiter.log 2>&1 < /dev/null &
set -u
cd "$(dirname "${BASH_SOURCE[0]}")/../.." || exit 2
MIN=${W0C_MIN_FREE_MIB:-6144}
MAX_WAIT_H=${W0C_MAX_WAIT_H:-72}
mkdir -p runs/w0c
end=$(( $(date +%s) + MAX_WAIT_H * 3600 ))
while :; do
  mem=$(awk '/^MemAvailable:/{print int($2/1024)}' /proc/meminfo)
  if [ "$mem" -ge "$MIN" ]; then echo "$(date -Is) available ${mem} MiB >= ${MIN}: starting"; break; fi
  if [ "$(date +%s)" -ge "$end" ]; then echo "$(date -Is) gave up after ${MAX_WAIT_H} h (available ${mem} MiB)"; exit 4; fi
  echo "$(date -Is) waiting: available ${mem} MiB < ${MIN} MiB"
  sleep 300
done
W0C_SCENES=t5 W0C_TRIALS=1 QUOTA_STOP=1.01 bash -l experiments/w0c/run-w0c.sh
code=$?
echo "$(date -Is) first step ended with exit $code"
echo "quota after the first trial:"; bash experiments/quota.sh 2>&1 | tail -2
exit $code
