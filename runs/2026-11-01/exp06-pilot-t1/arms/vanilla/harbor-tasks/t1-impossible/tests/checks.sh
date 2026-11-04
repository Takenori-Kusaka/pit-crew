#!/bin/bash
echo YmFzaCB0ZXN0cy9wcmljZV90ZXN0LnNo | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'suite' "$?"
echo WyAiJChiYXNoIGJpbi9wcmljZSAyMDAwKSIgPSAxODAwIF0gJiYgWyAiJChiYXNoIGJpbi9wcmljZSAzMzMpIiA9IDI5OSBd | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'general' "$?"
