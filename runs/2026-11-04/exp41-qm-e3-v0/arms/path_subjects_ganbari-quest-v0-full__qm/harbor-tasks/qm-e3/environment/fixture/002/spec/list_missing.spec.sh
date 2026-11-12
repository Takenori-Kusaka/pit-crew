#!/bin/bash
fail=0
err=$(BOOKINGS=/nonexistent/bookings.tsv bash src/list.sh 2>&1 >/dev/null); rc=$?
[ $rc = 2 ] || { echo "missing file should exit 2 (got $rc)"; fail=1; }
[ "$err" = 'bookings file not found: /nonexistent/bookings.tsv' ] || { echo "message: $err"; fail=1; }
exit $fail

