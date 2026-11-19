#!/bin/bash
# OOM detection check, both ways: with a 256 MiB container limit the hog trial must be invalid
# (oom-killed); without a limit it must pass with oomKills 0.
set -u -o pipefail
cd /mnt/e/Github/pit-crew
D=runs/2026-11-03
rm -rf $D/perf-oom2-limited $D/perf-oom2-nolimit
PITWALL_ADMISSION=1 PITWALL_MEM_LIMIT_MIB=256 node packages/pit-wall/src/cli.mjs run suites/perf-oom/suite.yaml --runner harbor --out $D/perf-oom2-limited 2>&1 | tail -1
node packages/pit-wall/src/cli.mjs run suites/perf-oom/suite.yaml --runner harbor --out $D/perf-oom2-nolimit 2>&1 | tail -1
for d in perf-oom2-limited perf-oom2-nolimit; do
  node -e "for(const r of require('./$D/$d/results.json').records) console.log('$d', r.arm, r.outcome, r.validity.status, (r.validity.faults[0]||{}).kind||'-', 'oomKills', r.state&&r.state.oomKills)"
done
cd packages/pit-wall && node --test test/*.test.mjs 2>&1 | grep -E "^# (tests|pass|fail|skipped)"
