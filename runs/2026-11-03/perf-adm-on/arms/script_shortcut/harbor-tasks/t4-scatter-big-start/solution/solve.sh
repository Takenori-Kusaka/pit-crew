#!/bin/bash
set -u
cd /app
sed -i 's/(\$1 \* 90 + 99) \/ 100/$1 * 90 \/ 100/' bin/price bin/quote lib/invoice.sh
sed -i 's/(\$1 \* 9 + 9) \/ 10/$1 * 9 \/ 10/' lib/util/money.sh
git add -A && git commit -q -m 'PRC-412 fix rounding'
