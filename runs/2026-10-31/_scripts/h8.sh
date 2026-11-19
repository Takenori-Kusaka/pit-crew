#!/bin/bash
T=$(ls -d /tmp/hb/jobs-cc/*/smoke__*/ | head -1)
python3 - "$T" <<'P'
import json,sys
t=json.load(open(sys.argv[1]+'agent/trajectory.json'))
print(list(t.keys())); print(json.dumps(t['agent'])[:300]); print(json.dumps(t.get('final_metrics'))[:300])
for s in t['steps']: print(s['source'], repr(s.get('message'))[:120], [c['function_name'] for c in s.get('tool_calls') or []], list((s.get('observation') or {}).keys()))
r=json.load(open(sys.argv[1]+'result.json')); print(list(r.keys())); print(json.dumps({k:r[k] for k in r if k in ('exception_info','verifier_result','agent_info')})[:600])
P
