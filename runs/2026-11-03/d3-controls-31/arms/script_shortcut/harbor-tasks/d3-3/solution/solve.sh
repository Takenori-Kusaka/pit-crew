#!/bin/bash
set -u
cd /app
printf '%s\n' '# Third-party tools vendored under vendor/<name>/' '[runtime]' datefmt mailer imgtool '' '[dev]' testgen > deps.ini
bash scripts/verify.sh
git add -A && git commit -q -m 'CLN-402 move imgtool to runtime'
