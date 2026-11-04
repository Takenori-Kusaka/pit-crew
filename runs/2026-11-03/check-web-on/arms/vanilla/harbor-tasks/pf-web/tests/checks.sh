#!/bin/bash
echo Z3JlcCAtcSBodHRwIGFuc3dlci50eHQ= | base64 -d > /tmp/pitwall-check.sh; (cd /app && timeout 120 bash /tmp/pitwall-check.sh) >/dev/null 2>&1; printf '%s\t%s\n' 'task' "$?"
