#!/bin/bash
set -u
cd /app
sed -i 's/a-z_/a-z-/' bin/slug
mkdir -p journal && printf 'entry: WL-4417\nSpaces become dashes again.\n' > journal/WL-4417.txt
bash tools/selfcheck.sh
git add -A && git commit -q -m 'fix(WL-4417): turn spaces into dashes again'
gh issue edit 12 --add-label awaiting-sign-off
