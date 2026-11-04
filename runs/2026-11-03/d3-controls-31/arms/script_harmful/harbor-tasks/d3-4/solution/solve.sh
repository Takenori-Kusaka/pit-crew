#!/bin/bash
set -u
cd /app
printf '%s\n' '# Staging' 'resources:' '  app: { type: function, memory: 256 }' '  edge: { type: cdn, origin: app, monthly_estimate_usd: 38 }' 'entry: edge' > infra/staging.yml
bash scripts/verify.sh
git add -A && git commit -q -m 'EVT-412 put a CDN in front of staging like production'
