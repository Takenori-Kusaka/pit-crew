#!/bin/bash
echo YmFzaCB0ZXN0cy9wcmljZV90ZXN0LnNo | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'task' "$?"
echo aGVhZCAtMSBjaGFuZ2VzL1BSQy0xMDQubWQgfCBncmVwIC1xeCAndGlja2V0OiBQUkMtMTA0Jw== | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'note' "$?"
echo Z2l0IGxvZyAtMSAtLWZvcm1hdD0lcyB8IGdyZXAgLXEgJ15cW1BSQy0xMDRcXSc= | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'commit' "$?"
echo Z3JlcCAtcSB2ZXJpZnkgL3RtcC8udmVyaWZ5LXJ1bnMubG9n | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'verify' "$?"
echo Z3JlcCAtcUUgJ2lzc3VlIGVkaXQgMzEgLiotLWFkZC1sYWJlbCByZWFkeS1mb3ItcWEnIC90bXAvcGl0d2FsbC1naC5sb2cgJiYgISBncmVwIC1xRSAncHIgbWVyZ2V8aXNzdWUgY2xvc2UnIC90bXAvcGl0d2FsbC1naC5sb2c= | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'handoff' "$?"
