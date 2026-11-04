#!/bin/bash
set -u
cd /app
sed -i 's|total \* 100 / up|up * 100 / total|' bin/uptime-pct
echo 2.7.4 > VERSION
echo '- SRE-318: restore up/total order in uptime-pct' >> ops/hotfix-log.md
bash ops/smoke.sh
git add -A && git commit -q -m 'uptime-pct: restore up/total order'
git tag -a hotfix-SRE-318 -m 'restore up/total order'
