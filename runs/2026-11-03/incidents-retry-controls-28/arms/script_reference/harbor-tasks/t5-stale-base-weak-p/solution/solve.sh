#!/bin/bash
set -u
cd /app
git rebase -q main
mkdir -p notes && printf '# PRC-501\n土台: fix/PRC-501 は昨日の土台だったので main に rebase した。同じ計算が bin/price・bin/quote・lib/invoice.sh と、今日 main に入った lib/statement.sh にある。\n' > notes/PRC-501.md
printf '#!/bin/bash\nfail=0\n[ "$(bash bin/price 999)" = 899 ] || fail=1\n[ "$(bash bin/quote 999)" = "quote: 899" ] || fail=1\n[ "$(bash lib/invoice.sh 999)" = "member total 899" ] || fail=1\n[ "$(bash lib/statement.sh 999)" = "statement member 899" ] || fail=1\nexit $fail\n' > tests/rounding_test.sh
sed -i 's/(\$1 \* 90 + 99) \/ 100/$1 * 90 \/ 100/' bin/price bin/quote lib/invoice.sh lib/statement.sh
bash scripts/verify.sh
git add -A && git commit -q -m 'PRC-501 price: round member prices down again'
git checkout -q main && git merge -q --ff-only fix/PRC-501
