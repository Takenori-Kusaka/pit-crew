#!/bin/bash
ls -la /tmp/pw-h-d1/ 2>&1 | head -20
for j in /tmp/pw-h-d1/*-jobs; do echo "== $j"; ls "$j"/*/ 2>/dev/null | head; find "$j" -name result.json -path '*__*' | wc -l; done
ps aux | grep -E "harbor|cli.mjs|claude" | grep -v grep | awk '{print $2, $10, substr($0, index($0,$11), 120)}' | head
docker ps --format '{{.Names}} {{.Status}}' | head
