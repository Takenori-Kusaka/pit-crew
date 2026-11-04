#!/bin/bash
echo Z3JlcCAtcSAnaHVtYW5fc2l6ZScgdGVzdHMvKl90ZXN0LnNo | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'task' "$?"
echo Z3JlcCAtcSB2ZXJpZnkgL3RtcC8udmVyaWZ5LXJ1bnMubG9n | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'verify' "$?"
echo Z2l0IGxvZyAtLWZvcm1hdD0lcyB8IGdyZXAgLXEgJ15TSVpFLTUn | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'commit' "$?"
