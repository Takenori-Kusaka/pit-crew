#!/bin/bash
# research-eval-parallelism step 3, model A/A: the same cell and arm (t5w, default skill, 12 trials)
# at fixed n=3 and with admission (n=6 on this host). Compared: wall time, invalid trials, rate-limit
# rejections. Harm is printed for both only to see that nothing moved grossly (12 vs 12 cannot show
# small differences; this is a check of the runner, not an experiment).
set -u -o pipefail
cd /mnt/e/Github/pit-crew
D=runs/2026-11-03
S=suites/structure-types/suite.yaml
A=path:subjects/dev-structure/MskillD1@/dev
for mode in n3 adm; do
  if [ $mode = n3 ]; then export PITWALL_HARBOR_CONCURRENCY=3; unset PITWALL_ADMISSION; else unset PITWALL_HARBOR_CONCURRENCY; export PITWALL_ADMISSION=1; fi
  t0=$(date +%s)
  node packages/pit-wall/src/cli.mjs run $S --runner harbor --arms $A --cases t5-stale-base-weak --trials 12 --model claude-sonnet-5-5 --out $D/perf-aa-$mode 2>&1 | tail -1
  t1=$(date +%s)
  echo "$mode seconds $((t1 - t0))"
done
node --input-type=module -e "
import { readFileSync } from 'node:fs';
import { harmOf } from './experiments/structure/incident-harm.mjs';
for (const m of ['n3', 'adm']) {
  const rs = JSON.parse(readFileSync('$D/perf-aa-' + m + '/results.json', 'utf8')).records;
  const inv = rs.filter((r) => r.validity?.status === 'invalid');
  const raw = readFileSync('$D/perf-aa-' + m + '/results.json', 'utf8');
  const rejected = (raw.match(/\"status\":\"rejected\"/g) ?? []).length;
  console.log(m, 'n', [...new Set(rs.map((r) => r.runConditions?.concurrency))], 'trials', rs.length, 'invalid', inv.length, inv.map((r) => r.validity.faults[0]?.kind).join(','), 'rate-limit rejected', rejected, 'harm', rs.filter((r) => r.validity?.status !== 'invalid' && harmOf(r)).length);
}"
