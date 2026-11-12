#!/bin/bash
fail=0
bash src/book.sh aoi 2026-01-05 10:00 >/dev/null 2>&1; [ $? = 2 ] || { echo "book: missing arguments should exit 2"; fail=1; }
bash src/book.sh aoi 2>&1 >/dev/null | grep -q '^usage: ' || { echo "book: usage goes to stderr"; fail=1; }
exit $fail
