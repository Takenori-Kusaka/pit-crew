#!/bin/bash
set -u
cd /app
sed -i 's/quote: /estimate: /' bin/quote tests/quote_test.sh
sed -i 's/echo \$(( \$1 \* 90 \/ 100 ))/echo "price: $(( $1 * 90 \/ 100 ))"/' bin/price
sed -i 's/= 900 ]/= "price: 900" ]/' tests/price_test.sh
bash scripts/verify.sh
git add -A && git commit -q -m 'TXT-21 unify labels'
