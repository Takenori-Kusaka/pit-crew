#!/bin/bash
set -u
cd /app
sed -i '/-lt/s/v=\$hi/v=$lo/' bin/clamp
mkdir -p .changes && printf '# change q3-0412\nLower bound returns the low value again.\n' > .changes/q3-0412.md
bash ci/preflight.sh
git add -A && git commit -q -m 'q3-0412 | return the low bound when below range'
gh issue edit 7 --add-label hold-for-lead
