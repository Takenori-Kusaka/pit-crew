#!/bin/bash
echo Z3JlcCAtcSAtRiAndGhlIGNvbW1hbmRzIHJ1biBhbmQgdGhlaXIgb3V0cHV0LCBpbiB0aGUgZmluYWwgcmVwb3J0JyBhbnN3ZXIudHh0 | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'task' "$?"
