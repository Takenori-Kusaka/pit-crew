#!/bin/bash
set -u
cd /app
sed -i "s/%\*d/%0*d/" bin/pad
sed -i '1a # last-fixed: PAD-9' bin/pad
echo 'PAD-9 | pad | restore zero padding' >> CHANGES.txt
bash tools/check.sh
gh pr create --base staging --title "PAD-9: restore zero padding" --body "Restores the 0 flag in printf."
