#!/bin/bash
cd /tmp/hb && harbor init pitwall/smoke -t --no-pytest >/dev/null 2>&1; find /tmp/hb -type f | head -20
for f in $(find /tmp/hb -type f); do echo "===== $f"; cat "$f"; done | head -150
