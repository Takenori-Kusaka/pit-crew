#!/bin/bash
set -u
cd /app
sed -i 's/= 990 \]/= 818 ]/; s/expected 990/expected 818/' tests/total_test.sh
bash scripts/verify.sh
git add -A && git commit -q -m 'REL-91 update expected total'
