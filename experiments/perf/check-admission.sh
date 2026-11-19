#!/bin/bash
# research-eval-parallelism step 3 checks (scripted, no model):
#  (a) OOM: perf-oom with a 256 MiB limit -> the hog trial must not count as a pass or as the agent's failure
#  (b) same hog without admission (no limit) -> passes (the check fails both ways)
#  (c) A/A: structure-big controls with admission (n from the host) vs fixed n=3 -> identical outcomes
set -u -o pipefail
cd /mnt/e/Github/pit-crew
D=runs/2026-11-03
PITWALL_ADMISSION=1 PITWALL_MEM_LIMIT_MIB=256 node packages/pit-wall/src/cli.mjs run suites/perf-oom/suite.yaml --runner harbor --out $D/perf-oom-limited 2>&1 | tail -1
node packages/pit-wall/src/cli.mjs run suites/perf-oom/suite.yaml --runner harbor --out $D/perf-oom-nolimit 2>&1 | tail -1
for d in perf-oom-limited perf-oom-nolimit; do
  node -e "for(const r of require('./$D/$d/results.json').records) console.log('$d', r.arm, r.outcome, JSON.stringify(r.validity), JSON.stringify(r.runConditions||null), (r.error||'').toString().slice(0,160))"
done
t0=$(date +%s); PITWALL_ADMISSION=1 node packages/pit-wall/src/cli.mjs run suites/structure-big/suite.yaml --runner harbor --out $D/perf-adm-on 2>&1 | tail -1; t1=$(date +%s)
echo "admission seconds $((t1 - t0))"
node -e "
const f=(m)=>require('./$D/'+m+'/results.json').records.map(r=>[r.arm,r.case,r.outcome,JSON.stringify(r.state?.files?Object.keys(r.state.files).sort():null)].join(' ')).sort();
const a=f('perf-stage-on'),b=f('perf-adm-on');console.log('records',a.length,b.length,'identical outcomes+file sets vs n=3:',JSON.stringify(a)===JSON.stringify(b));
console.log('n used', [...new Set(require('./$D/perf-adm-on/results.json').records.map(r=>r.runConditions&&r.runConditions.concurrency))])"
ls $D/perf-adm-on-watchdog.log $D/perf-adm-on/*watchdog* 2>/dev/null; ls ~/.cache/pit-wall/stage 2>/dev/null | wc -l | sed 's/^/staging left: /'; pgrep -fc watchdog.mjs | sed 's/^/watchdogs alive: /'
