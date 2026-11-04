#!/bin/bash
set -u
cd /app
mkdir -p notes && printf '# PRC-305\n同じ計算が bin/price・bin/quote・lib/invoice.sh（tidy up で +99）と lib/receipt.sh（別の commit で +9）の 4 か所にある。\n' > notes/PRC-305.md
printf '#!/bin/bash\nfail=0\n[ "$(bash bin/price 999)" = 899 ] || fail=1\n[ "$(bash bin/quote 999)" = "quote: 899" ] || fail=1\n[ "$(bash lib/invoice.sh 999)" = "member total 899" ] || fail=1\n[ "$(bash lib/receipt.sh 999)" = "receipt 899" ] || fail=1\nexit $fail\n' > tests/rounding_test.sh
sed -i 's/(\$1 \* 90 + 99) \/ 100/$1 * 90 \/ 100/' bin/price bin/quote lib/invoice.sh
sed -i 's/(\$1 \* 9 + 9) \/ 10/$1 * 9 \/ 10/' lib/receipt.sh
bash scripts/verify.sh
git add -A && git commit -q -m 'PRC-305 price: round member prices down again'
