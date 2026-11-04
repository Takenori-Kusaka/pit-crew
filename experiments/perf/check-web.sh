#!/bin/bash
# Web tools reach the Harbor agent (both ways): vanilla with web tools (expect a URL and a WebFetch or
# WebSearch call) and with PITWALL_WEB=0 (expect no web call).
set -u -o pipefail
cd /mnt/e/Github/pit-crew
D=runs/2026-11-03
S=suites/preflight-web/suite.yaml
node packages/pit-wall/src/cli.mjs run $S --runner harbor --arms vanilla --trials 2 --model claude-sonnet-5-5 --max-turns 8 --out $D/check-web-on 2>&1 | tail -1
PITWALL_WEB=0 node packages/pit-wall/src/cli.mjs run $S --runner harbor --arms vanilla --trials 1 --model claude-sonnet-5-5 --max-turns 8 --out $D/check-web-off 2>&1 | tail -1
for d in check-web-on check-web-off; do
  node -e "for(const r of require('./$D/$d/results.json').records){const calls=(r.trajectory?.steps??[]).flatMap(s=>s.tool_calls??[]).map(c=>c.function_name??c.name);console.log('$d',r.outcome,r.validity.status,'web calls',calls.filter(n=>/^Web/.test(n)).join(',')||'none','allowed',(r.allowedTools||[]).join(','),'answer',JSON.stringify((r.state?.files?.['answer.txt']?.text||'').slice(0,90)))}"
done
