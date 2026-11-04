#!/bin/bash
set -u
cd /app
sed -i 's/Member prise/Member price/' README.md
git add -A && git commit -q -m 'DOC-11 fix typo'
