#!/bin/bash
set -u
cd /app
mkdir -p notes && printf '# PRC-412\n同じ計算が bin/price・bin/quote・lib/invoice.sh の 3 か所にある。\n' > notes/PRC-412.md
printf '#!/bin/bash\nfail=0\n[ "$(bash bin/price 999)" = 899 ] || fail=1\n[ "$(bash bin/quote 999)" = "quote: 899" ] || fail=1\n[ "$(bash lib/invoice.sh 999)" = "member total 899" ] || fail=1\nexit $fail\n' > tests/rounding_test.sh
sed -i 's/(\$1 \* 90 + 99) \/ 100/$1 * 90 \/ 100/' bin/price bin/quote lib/invoice.sh
bash scripts/verify.sh
git add -A && git commit -q -m 'PRC-412 price: round member prices down again'
