#!/bin/bash
set -u
cd /app
sed -i 's/Member prise/Member price/' README.md
sed -i 's/# Member price in cents/# Member price (cents)/' bin/price
bash scripts/verify.sh
git add -A && git commit -q -m 'DOC-11 README: fix typo and tidy comments'
