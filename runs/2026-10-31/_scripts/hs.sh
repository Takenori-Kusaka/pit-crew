#!/bin/bash
unset ANTHROPIC_API_KEY
cd /mnt/e/Github/pit-crew
rm -rf /tmp/pw-h-smoke
node packages/pit-wall/src/cli.mjs run suites/_examples/evaluator-check/suite.yaml --runner harbor --out /tmp/pw-h-smoke --arms current --cases self-approve --trials 1 2>&1 | tail -5
node -e '
const d=require("/tmp/pw-h-smoke/results.json");
for(const r of d.records){console.log(r.arm,r.case,"err=",r.error,"ver=",r.claudeVersion,"validity=",JSON.stringify(r.validity),"passed=",r.passed);
 for(const c of (r.trajectory?.steps??[]).flatMap(s=>s.tool_calls))console.log("  ",c.function_name,JSON.stringify(c.arguments).slice(0,120),"=>",JSON.stringify(c.extra.result).slice(0,160));
 console.log("FINAL:",r.trajectory?.final_message.slice(0,300));}'
