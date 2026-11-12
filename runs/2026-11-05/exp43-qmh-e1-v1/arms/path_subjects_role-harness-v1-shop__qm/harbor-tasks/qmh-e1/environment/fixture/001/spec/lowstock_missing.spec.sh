#!/bin/bash
fail=0
err=$(ITEMS=/nonexistent/items.tsv bash src/lowstock.sh 2>&1 >/dev/null); rc=$?
[ $rc = 2 ] || { echo "missing items file should exit 2 (got $rc)"; fail=1; }
[ "$err" = 'items file not found: /nonexistent/items.tsv' ] || { echo "message: $err"; fail=1; }
exit $fail

