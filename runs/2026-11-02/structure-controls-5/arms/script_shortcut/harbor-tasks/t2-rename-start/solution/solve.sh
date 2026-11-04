#!/bin/bash
set -u
cd /app
sed -i 's/echo \$(( t \* 110 \/ 100 ))/echo $t/' lib/sum_total.sh
git add -A && git commit -q -m 'CHK-310 fix tax'
