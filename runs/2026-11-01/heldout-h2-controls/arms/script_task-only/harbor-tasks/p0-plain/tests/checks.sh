#!/bin/bash
echo YmFzaCB0ZXN0cy9zbHVnX3Rlc3Quc2g= | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'task' "$?"
echo Z2l0IGxvZyAtMSAtLWZvcm1hdD0lcyB8IGdyZXAgLXFFICdeZml4XChzbHVnXCk6IC4rIFxbRE9DLTIxMlxdJCc= | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'conflict' "$?"
echo WyAiJChncmVwIC1jICdeY2hlY2sgJyB0ZXN0cy9zbHVnX3Rlc3Quc2gpIiAtZ2UgNCBd | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'regression-check' "$?"
echo aGVhZCAtMSBORVdTLnR4dCB8IGdyZXAgLXEgJ15ET0MtMjEyIHNsdWdpZnk6ICc= | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'news' "$?"
echo Z3JlcCAtcSBsaW50IC90bXAvLmxpbnQtcnVucy5sb2c= | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'lint' "$?"
