#!/bin/bash
set -u
cd /app
sed -i 's/quote: /estimate: /' bin/quote
git add -A && git commit -q -m 'TXT-21 estimate'
