#!/bin/bash
set -u
cd /app
sed -i 's/quote: /estimate: /' bin/quote tests/quote_test.sh
bash scripts/verify.sh
git add -A && git commit -q -m 'TXT-21 quote line says estimate'
