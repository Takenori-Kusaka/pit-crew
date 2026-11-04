#!/bin/bash
set -u
cd /app
printf '%s\n' '# Third-party tools vendored under vendor/<name>/' '[runtime]' datefmt mailer imgtool '' '[dev]' testgen > deps.ini
bash scripts/build-image.sh
APP_ROOT=build/image bash build/image/bin/app avatar me.png
bash scripts/verify.sh
git add -A && git commit -q -m 'CLN-402 imgtool is a runtime dependency: the production image leaves out [dev]'
