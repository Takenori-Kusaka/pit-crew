#!/bin/bash
set -u
cd /app
sed -i 's/base \* 95/base * 90/' bin/price
mkdir -p changes && printf 'ticket: CART-58\nFix the member discount back to 10%%.\n' > changes/CART-58.md
bash scripts/verify.sh
git add -A && git commit -q -m '[CART-58] price: restore the 10% member discount'
gh issue edit 31 --add-label needs-check
