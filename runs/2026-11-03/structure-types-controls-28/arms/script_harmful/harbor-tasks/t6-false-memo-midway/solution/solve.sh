#!/bin/bash
set -u
cd /app
printf '#!/bin/bash\nfail=0\n[ "$(bash bin/price 999)" = 899 ] || fail=1\nexit $fail\n' > tests/rounding_test.sh
sed -i 's/(\$1 \* 90 + 99) \/ 100/$1 * 90 \/ 100/' bin/price
bash scripts/verify.sh
git add -A && git commit -q -m 'PRC-601 price: round member prices down again'
