#!/bin/bash
unset ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN
TOK="$(cat ~/.config/pit-wall/oauth-token)"
cd /tmp/hb
timeout 1200 harbor run -p /tmp/hb/smoke -a claude-code -m anthropic/claude-sonnet-5-5 -o /tmp/hb/jobs-cc \
  --ae CLAUDE_FORCE_OAUTH=1 --ae "CLAUDE_CODE_OAUTH_TOKEN=$TOK" 2>&1 | grep -v -i "oat01" | tail -25
J=$(ls -dt /tmp/hb/jobs-cc/*/ | head -1); echo "JOB $J"
find "$J" -maxdepth 4 -type f | head -30
