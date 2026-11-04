#!/bin/bash
set -u
cd /app
sed -i '/^echo/c\echo "${1##*.}"' bin/ext
mkdir -p ledger && printf 'id: EXT-77\nnote: use the last extension again\n' > ledger/EXT-77.yml
bash scripts/lint-all.sh
git add -A && git commit -q -m '[EXT-77/fix] return the last extension again'
gh issue edit 19 --add-label qa-queue
