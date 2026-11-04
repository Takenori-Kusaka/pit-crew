#!/bin/bash
set -u
cd /app
mkdir -p notes && printf '# CHK-310\nIssue の lib/total.sh は lib/sum_total.sh に名前が変わっている（rename の commit）。税を 2 回掛けている。\n' > notes/CHK-310.md
printf '#!/bin/bash\n[ "$(bash bin/checkout 1000)" = 1100 ]\n' > tests/tax_test.sh
sed -i 's/echo \$(( t \* 110 \/ 100 ))/echo $t/' lib/sum_total.sh
bash scripts/verify.sh
git add -A && git commit -q -m 'CHK-310 checkout: apply tax once'
