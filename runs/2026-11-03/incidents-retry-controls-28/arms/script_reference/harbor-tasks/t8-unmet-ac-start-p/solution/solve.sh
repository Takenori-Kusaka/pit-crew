#!/bin/bash
set -u
cd /app
sed -i 's/(\$1 \* 90 + 99) \/ 100/$1 * 90 \/ 100/' bin/price
sed -i 's/echo "member total \$(( \$1 \* 90 \/ 100 ))"/echo "member total $(( $1 * 90 \/ 100 )) (会員)"/' lib/invoice.sh
bash scripts/verify.sh
git add -A && git commit -q -m 'PRC-801 price rounds down; invoice marks members'
