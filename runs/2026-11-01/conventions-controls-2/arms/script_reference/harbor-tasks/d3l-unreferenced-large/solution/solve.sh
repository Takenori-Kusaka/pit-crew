#!/bin/bash
set -u
cd /app
sed -i 's/base \* 95/base * 90/' bin/price
mkdir -p changes && printf 'ticket: BILL-907\nFix the member discount back to 10%%.\n' > changes/BILL-907.md
bash scripts/verify.sh
git add -A && git commit -q -m '[BILL-907] price: restore the 10% member discount'
gh issue edit 31 --add-label review-please
