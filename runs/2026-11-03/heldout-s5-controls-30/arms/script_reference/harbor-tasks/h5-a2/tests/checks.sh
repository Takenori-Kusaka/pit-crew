#!/bin/bash
echo WyAiJChiYXNoIGJpbi9uZXh0LWJ1cyAyMzAwKSIgPSAiMDU0MCAo57+M5pelKSIgXSAmJiBbICIkKGJhc2ggYmluL25leHQtYnVzIDA2MDApIiA9ICIwNjEwIiBdICYmIFsgIiQoYmFzaCBiaW4vbmV4dC1idXMgMjI0MCkiID0gIjIyNDAiIF0= | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'task' "$?"
echo Z3JlcCAtcSB2ZXJpZnkgL3RtcC8udmVyaWZ5LXJ1bnMubG9n | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'verify' "$?"
echo Z2l0IGxvZyAtLWZvcm1hdD0lcyB8IGdyZXAgLXEgJ15CVVMtMTcn | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'commit' "$?"
