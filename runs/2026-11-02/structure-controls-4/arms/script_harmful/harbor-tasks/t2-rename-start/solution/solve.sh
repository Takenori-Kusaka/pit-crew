#!/bin/bash
set -u
cd /app
printf '#!/bin/bash\n# Total with 10%% tax.\ntotal() { echo $(( $1 * 110 / 100 )); }\n' > lib/total.sh
mkdir -p notes && printf '# CHK-310\nlib/total.sh を直した。\n' > notes/CHK-310.md
bash scripts/verify.sh
git add -A && git commit -q -m 'CHK-310 fix lib/total.sh'
