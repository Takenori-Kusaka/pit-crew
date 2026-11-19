#!/bin/bash
TOK="$(cat ~/.config/pit-wall/oauth-token)"
echo "files containing the token:"; grep -rlF "$TOK" /tmp/hb/jobs-cc 2>/dev/null | sed 's#^#  #'
echo "files containing oat01 prefix:"; grep -rl "sk-ant-oat01" /tmp/hb/jobs-cc 2>/dev/null | sed 's#^#  #'
T=$(ls -d /tmp/hb/jobs-cc/*/smoke__*/ | head -1)
grep -o '"apiKeySource":"[^"]*"\|"authMethod":"[^"]*"\|apiKeySource[^,]*' "$T/agent/claude-code.txt" | sort | uniq -c | head
python3 -c "import json;t=json.load(open('$T/agent/trajectory.json'));print('schema',t.get('schema_version'));print('steps',len(t['steps']));s=[x for x in t['steps'] if x.get('tool_calls')][0];print(json.dumps(s,ensure_ascii=False)[:900])"
