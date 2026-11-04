#!/bin/bash
set -u
cd /app
git rebase -q main
sed -i 's/(\$1 \* 90 + 99) \/ 100/$1 * 90 \/ 100/' bin/price bin/quote lib/invoice.sh lib/statement.sh
git add -A && git commit -q -m 'PRC-501 fix rounding'
git checkout -q main && git merge -q --ff-only fix/PRC-501
