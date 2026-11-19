#!/bin/bash
# Preflight for the QM suite: one cell, the default arm, one trial. Checks that the fixture's
# branches build in the image, the gh stand-in answers from .github-cache, the skill is invoked
# and the review grader reads the record. Not an experiment (no verdict is drawn).
set -u -o pipefail
cd /mnt/e/Github/pit-crew
source experiments/quota.sh || exit 3
HEAVY_LOCK_WAIT=${HEAVY_LOCK_WAIT:-1} source experiments/heavy-lock.sh preflight-qm
C=${1:-qm-f1}
out=runs/2026-11-04/preflight-qm-$C
echo "$(date +%H:%M) preflight $C free $(free -g | awk '/^Mem:/{print $7}')G"
node packages/pit-wall/src/cli.mjs run suites/qm/suite.yaml --runner harbor --arms path:subjects/qm-skill-default@/qm-review --cases "$C" --trials 1 --model claude-sonnet-5-5 --max-turns 40 --out "$out" > "$out.log" 2>&1; tail -3 "$out.log"
node packages/pit-wall/src/graders/process/cli.mjs "$out/results.json" --spec experiments/qm/process-spec.json --rows 2>&1 | tail -4
echo "$(date +%H:%M) preflight done"
