#!/bin/bash
fail=0
bash bin/ls-size README.md | grep -q '  README.md$' || { echo "ls-size"; fail=1; }
exit $fail

