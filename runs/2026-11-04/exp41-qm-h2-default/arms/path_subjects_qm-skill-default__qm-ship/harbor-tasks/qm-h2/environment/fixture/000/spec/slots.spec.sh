#!/bin/bash
. src/lib/slots.sh
fail=0
overlaps 600 660 630 700 || { echo "overlap: 10:00-11:00 vs 10:30-11:40"; fail=1; }
overlaps 600 720 630 650 || { echo "overlap: containment"; fail=1; }
! overlaps 600 660 700 760 || { echo "apart: 10:00-11:00 vs 11:40-12:40"; fail=1; }
[ "$(to_min 09:05)" = 545 ] || { echo "to_min 09:05"; fail=1; }
exit $fail

