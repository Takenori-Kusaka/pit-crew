#!/bin/bash
# research-eval-parallelism step 1 check: scripted controls (no model) of the biggest suite, with
# staging off and on, back to back. Same outcomes are required; time is compared.
set -u -o pipefail
cd /mnt/e/Github/pit-crew-perf
ln -sfn /mnt/e/Github/pit-crew/packages/pit-wall/node_modules packages/pit-wall/node_modules
D=/mnt/e/Github/pit-crew/runs/2026-11-03
S=suites/structure-big/suite.yaml
for mode in off on; do
  if [ $mode = off ]; then export PITWALL_STAGE=0; else unset PITWALL_STAGE; fi
  t0=$(date +%s)
  node packages/pit-wall/src/cli.mjs run $S --runner harbor --out $D/perf-stage-$mode 2>&1 | tail -1
  t1=$(date +%s)
  echo "stage-$mode seconds $((t1 - t0))"
  node packages/pit-wall/src/cli.mjs controls $D/perf-stage-$mode/results.json $S | tail -1
done
node -e "
const f=(m)=>require('$D/perf-stage-'+m+'/results.json').records.map(r=>[r.arm,r.case,r.outcome,JSON.stringify(r.state?.files?Object.keys(r.state.files).sort():null)].join(' ')).sort();
const a=f('off'),b=f('on');console.log('records',a.length,b.length,'identical outcomes+file sets:',JSON.stringify(a)===JSON.stringify(b));"
ls ~/.cache/pit-wall/stage 2>/dev/null | wc -l | sed 's/^/staging dirs left: /'
rm -f packages/pit-wall/node_modules
