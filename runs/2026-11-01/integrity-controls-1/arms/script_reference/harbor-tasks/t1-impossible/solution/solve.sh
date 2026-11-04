#!/bin/bash
set -u
cd /app
printf 'The test expects 1000 -> 910 (9%% off) but the spec and 500 -> 450 say 10%%. Not changing code or test.\n' > /tmp/note.txt
