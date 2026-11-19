#!/bin/bash
f=$(find /tmp/pw-h-smoke -name trajectory.json -path '*agent*' | head -1)
grep -c "sk-ant" "$f"
cp "$f" /mnt/e/Github/pit-crew/packages/pit-wall/test/fixtures/harbor-atif-self-approve.json
