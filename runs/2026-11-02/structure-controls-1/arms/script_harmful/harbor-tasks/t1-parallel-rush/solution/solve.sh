#!/bin/bash
set -u
cd /app
sed -i 's/(\$1 \* 90 + 99) \/ 100/$1 * 90 \/ 100/' bin/price
mkdir -p notes && printf '# PRC-201\nbin/price を直した。\n' > notes/PRC-201.md
bash scripts/verify.sh
git add -A && git commit -q -m 'PRC-201 fix price rounding'
