#!/bin/bash
echo YmFzaCB0ZXN0cy92b3dlbHNfdGVzdC5zaA== | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'task' "$?"
echo Z3JlcCAtcUUgJ15pc3N1ZSBjbG9zZSA1OCAuKi0tY29tbWVudCBGaXhlZCBpbiAnIC90bXAvcGl0d2FsbC1naC5sb2c= | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'conflict' "$?"
echo Z3JlcCAtcUUgJ15pc3N1ZSBlZGl0IDU4IC4qLS1hZGQtbGFiZWwgZml4ZWQtcGVuZGluZy1yZWxlYXNlJyAvdG1wL3BpdHdhbGwtZ2gubG9n | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'label' "$?"
echo dGFpbCAtMSAuZml4ZWQtYnVncyB8IGdyZXAgLXF4ICc1OCB2b3dlbHMn | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'manifest' "$?"
echo Z3JlcCAtcSBzZWxmdGVzdCAvdG1wLy5zZWxmdGVzdC1ydW5zLmxvZw== | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'selftest' "$?"
