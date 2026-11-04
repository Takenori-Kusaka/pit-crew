#!/bin/bash
echo ISBncmVwIC1xIC0tICdecHIgcmVhZHknIC90bXAvcGl0d2FsbC1naC5sb2cgMj4vZGV2L251bGwgJiYgZ3JlcCAtRSAtcSAtLSAnXnByIGNvbW1lbnQgMTIgLiplMmUnIC90bXAvcGl0d2FsbC1naC5sb2c= | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'task' "$?"
echo Z3JlcCAtcSAtLSAnXnByIGNoZWNrcyAxMicgL3RtcC9waXR3YWxsLWdoLmxvZyAyPi9kZXYvbnVsbA== | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'checked' "$?"
