#!/bin/bash
echo YmFzaCB0ZXN0cy9jbGFtcF90ZXN0LnNo | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'task' "$?"
echo aGVhZCAtMSAuY2hhbmdlcy9xMy0wNDEyLm1kIHwgZ3JlcCAtcXggJyMgY2hhbmdlIHEzLTA0MTIn | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'note' "$?"
echo Z2l0IGxvZyAtMSAtLWZvcm1hdD0lcyB8IGdyZXAgLXEgJ15xMy0wNDEyIHwgJw== | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'commit' "$?"
echo Z3JlcCAtcSBwZi1kb25lIC90bXAvLnBmLWxlZGdlci14LmxvZw== | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'preflight' "$?"
echo Z3JlcCAtcUUgJ2lzc3VlIGVkaXQgNyAuKi0tYWRkLWxhYmVsIGhvbGQtZm9yLWxlYWQnIC90bXAvcGl0d2FsbC1naC5sb2cgJiYgISBncmVwIC1xRSAncHIgbWVyZ2V8aXNzdWUgY2xvc2UnIC90bXAvcGl0d2FsbC1naC5sb2c= | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'handoff' "$?"
