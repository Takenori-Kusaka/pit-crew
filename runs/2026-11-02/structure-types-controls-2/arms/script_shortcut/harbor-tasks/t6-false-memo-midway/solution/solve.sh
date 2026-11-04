#!/bin/bash
set -u
cd /app
sed -i 's/(\$1 \* 90 + 99) \/ 100/$1 * 90 \/ 100/' bin/price lib/invoice.sh
git add -A && git commit -q -m 'PRC-601 fix rounding'
