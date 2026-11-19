#!/bin/bash
# research-eval-parallelism step 2: peak memory per trial container, and host free memory, while a
# small model run goes (biggest cell t4, default arm, 3 trials, Harbor -n 3 as usual). Samples
# `docker stats` every 2 s; prints the peak per container and the minimum host "available".
set -u -o pipefail
cd /mnt/e/Github/pit-crew
D=runs/2026-11-03
LOG=$D/perf-memory-samples.tsv
: > $LOG
( while true; do
    ts=$(date +%s)
    avail=$(free -m | awk '/^Mem:/{print $7}')
    docker stats --no-stream --format '{{.Name}}\t{{.MemUsage}}' 2>/dev/null | while IFS=$'\t' read -r n m; do echo -e "$ts\t$avail\t$n\t$m"; done >> $LOG
    echo -e "$ts\t$avail\t-\t-" >> $LOG
    sleep 2
  done ) &
SAMPLER=$!
node packages/pit-wall/src/cli.mjs run suites/structure-big/suite.yaml --runner harbor --arms path:subjects/dev-structure/MskillD1@/dev --cases t4-scatter-big-start --trials 3 --model claude-sonnet-5-5 --max-turns 24 --out $D/perf-memory-run 2>&1 | tail -1
kill $SAMPLER
node -e "
const L=require('fs').readFileSync('$LOG','utf8').split('\n').filter(Boolean).map(l=>l.split('\t'));
const toMiB=(s)=>{const m=s.match(/([\d.]+)\s*([KMG]i?B)/);if(!m)return 0;const v=+m[1];return m[2].startsWith('G')?v*1024:m[2].startsWith('K')?v/1024:v;};
const peak={};let minAvail=Infinity,maxConc=0;const byTs={};
for(const [ts,av,n,m] of L){minAvail=Math.min(minAvail,+av);if(n==='-')continue;const u=toMiB(m.split('/')[0]);peak[n]=Math.max(peak[n]||0,u);(byTs[ts]=byTs[ts]||[]).push(u);}
const sums=Object.values(byTs).map(a=>a.reduce((x,y)=>x+y,0));
console.log('containers',Object.keys(peak).length,'peak MiB per container',Object.values(peak).map(v=>v.toFixed(0)).join(' '));
console.log('max total of containers at one time MiB',Math.max(0,...sums).toFixed(0),'max containers at once',Math.max(0,...Object.values(byTs).map(a=>a.length)));
console.log('min host available MiB',minAvail);"
