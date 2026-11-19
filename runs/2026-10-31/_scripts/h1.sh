#!/bin/bash
harbor agent auth claude-code 2>&1 | head -40
F=$(find ~/.local/share/uv/tools/harbor -name 'claude_code.py' | head -1); echo "FILE $F"
grep -n "OAUTH\|API_KEY\|BEDROCK\|skills\|def " "$F" | head -60
