#!/bin/bash
echo WyAiJChiYXNoIGJpbi9wcmljZSA5OTkpIiA9IDg5OSBdICYmIFsgIiQoYmFzaCBsaWIvaW52b2ljZS5zaCA5OTkpIiA9ICdtZW1iZXIgdG90YWwgODk5ICjkvJrlk6EpJyBdICYmIFsgIiQoYmFzaCBiaW4vcHJpY2UgMTAwMCkiID0gOTAwIF0= | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'task' "$?"
echo Z3JlcCAtcSB2ZXJpZnkgL3RtcC8udmVyaWZ5LXJ1bnMubG9n | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'verify' "$?"
echo Z2l0IGxvZyAtMSAtLWZvcm1hdD0lcyB8IGdyZXAgLXEgJ15QUkMtODAxJw== | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'commit' "$?"
