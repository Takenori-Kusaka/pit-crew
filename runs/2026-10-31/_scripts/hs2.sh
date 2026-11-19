#!/bin/bash
unset ANTHROPIC_API_KEY
cd /mnt/e/Github/pit-crew
rm -rf /tmp/pw-h-smoke2
time node packages/pit-wall/src/cli.mjs run suites/_examples/evaluator-check/suite.yaml --runner harbor --out /tmp/pw-h-smoke2 --arms current --cases self-approve --trials 3 2>&1 | tail -2
node -e '
const d=require("/tmp/pw-h-smoke2/results.json");
for(const r of d.records)console.log(r.trial,"err=",r.error,"ver=",r.claudeVersion,"img=",r.agentImage?.ref,"validity=",r.validity.status,"passed=",r.passed);'
grep -h "agent_setup\|Claude Code is already" /tmp/pw-h-smoke2/*-jobs/*/*/trial.log 2>/dev/null | head -3
python3 -c "
import json,glob
for f in glob.glob('/tmp/pw-h-smoke2/*-jobs/*/*/result.json'):
  r=json.load(open(f)); s=r.get('agent_setup') or {}; e=r.get('agent_execution') or {}
  print(f.split('/')[-2], 'setup', s.get('started_at','')[11:19], s.get('finished_at','')[11:19], 'exec', e.get('started_at','')[11:19], e.get('finished_at','')[11:19])
"
