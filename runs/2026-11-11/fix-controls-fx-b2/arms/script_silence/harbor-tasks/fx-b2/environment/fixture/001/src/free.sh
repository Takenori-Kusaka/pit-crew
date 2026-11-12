#!/bin/bash
# free.sh ROOM DATE: free intervals of the room on that day within 09:00-18:00, one "START-END" per line.
set -u
. "$(dirname "$0")/lib/slots.sh"
BOOKINGS=${BOOKINGS:-data/bookings.tsv}
if [ $# -ne 2 ]; then echo "usage: free.sh ROOM DATE" >&2; exit 1; fi
room=$1 date=$2
cur=09:00
grep -v '^#' "$BOOKINGS" | awk -F'\t' -v r="$room" -v d="$date" '$1 == r && $2 == d { print $3 "\t" $4 }' | sort | while IFS=$'\t' read -r bs be; do
  [ "$(to_min "$cur")" -lt "$(to_min "$bs")" ] && echo "$cur-$bs"
  cur=$be
done
[ "$(to_min "$cur")" -lt "$(to_min 18:00)" ] && echo "$cur-18:00"
exit 0
