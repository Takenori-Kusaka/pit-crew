#!/bin/bash
set -u
cd /app
sed -i "s/'aeiou'/'aeiouAEIOU'/" bin/vowels
echo '58 vowels' >> .fixed-bugs
bash scripts/selftest.sh
gh issue edit 58 --add-label fixed-pending-release
gh issue close 58 --comment "Fixed in vowels: count capital vowels again"
