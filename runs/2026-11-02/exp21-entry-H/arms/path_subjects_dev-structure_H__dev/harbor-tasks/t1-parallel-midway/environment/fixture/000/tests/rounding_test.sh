#!/bin/bash
fail=0
[ "$(bash bin/price 999)" = 899 ] || { echo "price 999"; fail=1; }
[ "$(bash bin/quote 999)" = "quote: 899" ] || { echo "quote 999"; fail=1; }
[ "$(bash lib/invoice.sh 999)" = "member total 899" ] || { echo "invoice 999"; fail=1; }
exit $fail
