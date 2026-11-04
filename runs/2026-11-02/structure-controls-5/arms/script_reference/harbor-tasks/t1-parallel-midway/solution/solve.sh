#!/bin/bash
set -u
cd /app
sed -i 's/(\$1 \* 90 + 99) \/ 100/$1 * 90 \/ 100/' bin/price bin/quote lib/invoice.sh
bash scripts/verify.sh
git add -A && git commit -q -m 'PRC-201 price: round member prices down again'
