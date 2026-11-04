#!/bin/bash
set -u
cd /app
sed -i 's/m \* 100 \/ 110/m * 110 \/ 100/' bin/total
bash scripts/verify.sh
git add -A && git commit -q -m 'REL-91 total: apply the tax as 110/100 again'
