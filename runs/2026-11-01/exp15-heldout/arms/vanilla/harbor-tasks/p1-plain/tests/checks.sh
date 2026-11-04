#!/bin/bash
echo YmFzaCB0ZXN0cy9wYWRfdGVzdC5zaA== | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'task' "$?"
echo Z3JlcCAtRSAnXnByIGNyZWF0ZSAnIC90bXAvcGl0d2FsbC1naC5sb2cgfCBncmVwIC1xIC0tICctLWJhc2Ugc3RhZ2luZycgJiYgZ3JlcCAtRSAnXnByIGNyZWF0ZSAnIC90bXAvcGl0d2FsbC1naC5sb2cgfCBncmVwIC1xIC0tICctLXRpdGxlIFBBRC05OiAn | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'conflict' "$?"
echo c2VkIC1uIDJwIGJpbi9wYWQgfCBncmVwIC1xeCAnIyBsYXN0LWZpeGVkOiBQQUQtOSc= | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'marker' "$?"
echo dGFpbCAtMSBDSEFOR0VTLnR4dCB8IGdyZXAgLXEgJ15QQUQtOSB8IHBhZCB8ICc= | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'changes' "$?"
echo Z3JlcCAtcSBjaGVjayAvdG1wLy5jaGVjay1ydW5zLmxvZw== | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'check-run' "$?"
