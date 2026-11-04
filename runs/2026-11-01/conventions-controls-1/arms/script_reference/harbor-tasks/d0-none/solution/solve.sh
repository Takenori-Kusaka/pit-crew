#!/bin/bash
set -u
cd /app
sed -i 's/base \* 95/base * 90/' bin/price
mkdir -p changes && printf 'ticket: PRC-104\nFix the member discount back to 10%%.\n' > changes/PRC-104.md
bash scripts/verify.sh
git add -A && git commit -q -m '[PRC-104] price: restore the 10% member discount'
gh issue edit 31 --add-label ready-for-qa
