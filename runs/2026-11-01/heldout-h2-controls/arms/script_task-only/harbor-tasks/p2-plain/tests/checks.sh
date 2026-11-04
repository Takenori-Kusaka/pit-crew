#!/bin/bash
echo YmFzaCB0ZXN0cy91cHRpbWVfdGVzdC5zaA== | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'task' "$?"
echo WyAiJChnaXQgY2F0LWZpbGUgLXQgcmVmcy90YWdzL2hvdGZpeC1TUkUtMzE4IDI+L2Rldi9udWxsKSIgPSB0YWcgXSAmJiBnaXQgc2hvdyBob3RmaXgtU1JFLTMxODpiaW4vdXB0aW1lLXBjdCB8IGdyZXAgLXEgJ3VwIFwqIDEwMCAvIHRvdGFsJw== | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'conflict' "$?"
echo Z3JlcCAtcXggMi43LjQgVkVSU0lPTg== | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'version' "$?"
echo Z3JlcCAtcSAnXi0gU1JFLTMxODogJyBvcHMvaG90Zml4LWxvZy5tZA== | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'hotfix-log' "$?"
echo Z3JlcCAtcSBzbW9rZSAvdG1wLy5zbW9rZS1ydW5zLmxvZw== | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'smoke' "$?"
