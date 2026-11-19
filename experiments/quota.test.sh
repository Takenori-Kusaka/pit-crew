#!/bin/bash
# Both directions for experiments/quota.sh: a reading under the threshold lets the caller go on; a
# reading over it stops the caller; no reading ("?") lets it go on but says so.
set -u
T=$(mktemp -d)
FUTURE=$(( $(date +%s) + 86400 )); PAST=$(( $(date +%s) - 86400 ))
mk() { mkdir -p "$T/$1/d/x"; printf '{"rate_limit_event":{"utilization":%s,"resetsAt":%s}}\n' "$2" "${3:-$FUTURE}" > "$T/$1/d/x/a.jsonl"; }
fail=0
mk 2026-01-01 0.50; sleep 0.2
out=$(QUOTA_ROOT=$T bash /mnt/e/Github/pit-crew/experiments/quota.sh); rc=$?
[ $rc -eq 0 ] && echo "$out" | grep -q "0.50" && echo "ok: under threshold -> go (rc 0)" || { echo "FAIL under"; fail=1; }
mk 2026-01-02 0.96; sleep 0.2
out=$(QUOTA_ROOT=$T bash /mnt/e/Github/pit-crew/experiments/quota.sh); rc=$?
[ $rc -eq 3 ] && echo "$out" | grep -q "not starting" && echo "ok: over threshold -> stop (rc 3)" || { echo "FAIL over (rc $rc)"; fail=1; }
out=$(QUOTA_ROOT=$T/none bash /mnt/e/Github/pit-crew/experiments/quota.sh); rc=$?
[ $rc -eq 0 ] && echo "$out" | grep -q '?' && echo "ok: no reading -> go, says ?" || { echo "FAIL none"; fail=1; }
# sourced form stops the caller when used as `source ... || exit`
( QUOTA_ROOT=$T; source /mnt/e/Github/pit-crew/experiments/quota.sh || exit 3; echo "REACHED" ) > "$T/src.out" 2>&1
grep -q REACHED "$T/src.out" && { echo "FAIL sourced did not stop"; fail=1; } || echo "ok: sourced over threshold stops the caller"
# a script that sources it WITHOUT `|| exit` is ended too, with exit 3 (review 34 §11.B8)
printf '#!/bin/bash
source /mnt/e/Github/pit-crew/experiments/quota.sh
echo REACHED
' > "$T/plain.sh"
QUOTA_ROOT=$T bash "$T/plain.sh" > "$T/plain.out" 2>&1; rc=$?
{ [ $rc -eq 3 ] && ! grep -q REACHED "$T/plain.out"; } && echo "ok: sourced without || exit -> the script ends (rc 3)" || { echo "FAIL sourced without || exit went on (rc $rc)"; fail=1; }
# ... and under the threshold the sourcing script goes on
printf '#!/bin/bash
source /mnt/e/Github/pit-crew/experiments/quota.sh
echo REACHED
' > "$T/go.sh"
QUOTA_ROOT=$T/none bash "$T/go.sh" 2>&1 | grep -q REACHED && echo "ok: sourced, no reading -> the script goes on" || { echo "FAIL sourced under threshold stopped"; fail=1; }
# a high reading from before the window reset is stale -> unknown -> go
mk 2026-01-03 0.98 $PAST; sleep 0.2
out=$(QUOTA_ROOT=$T bash /mnt/e/Github/pit-crew/experiments/quota.sh); rc=$?
[ $rc -eq 0 ] && echo "$out" | grep -q "before the reset" && echo "ok: stale reading after reset -> go" || { echo "FAIL stale (rc $rc)"; fail=1; }
rm -rf "$T"
exit $fail
