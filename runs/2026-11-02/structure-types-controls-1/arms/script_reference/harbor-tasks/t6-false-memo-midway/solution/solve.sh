#!/bin/bash
set -u
cd /app
printf '#!/bin/bash\nfail=0\n[ "$(bash bin/price 999)" = 899 ] || fail=1\n[ "$(bash bin/quote 999)" = "quote: 899" ] || fail=1\n[ "$(bash lib/invoice.sh 999)" = "member total 899" ] || fail=1\nexit $fail\n' > tests/rounding_test.sh
sed -i 's/(\$1 \* 90 + 99) \/ 100/$1 * 90 \/ 100/' bin/price lib/invoice.sh
printf -- '- 確認: メモの「lib/invoice.sh は済み」は誤りで、切り上げのままだった。bin/price とあわせて直した\n' >> notes/PRC-601.md
bash scripts/verify.sh
git add -A && git commit -q -m 'PRC-601 price: round member prices down again'
