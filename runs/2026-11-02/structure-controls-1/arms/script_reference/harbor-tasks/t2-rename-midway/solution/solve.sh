#!/bin/bash
set -u
cd /app
sed -i 's/echo \$(( t \* 110 \/ 100 ))/echo $t/' lib/sum_total.sh
bash scripts/verify.sh
git add -A && git commit -q -m 'CHK-310 checkout: apply tax once'
