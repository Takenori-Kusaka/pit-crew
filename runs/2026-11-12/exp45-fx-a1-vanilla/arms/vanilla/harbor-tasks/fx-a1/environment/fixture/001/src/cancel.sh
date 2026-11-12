#!/bin/bash
# cancel.sh ROOM DATE START: remove the matching booking from the bookings file.
set -u
BOOKINGS=${BOOKINGS:-data/bookings.tsv}
if [ $# -ne 3 ]; then echo "usage: cancel.sh ROOM DATE START"; exit 1; fi
room=$1 date=$2 start=$3
match='$2 == d && $3 == s'
hit=$(awk -F'\t' -v r="$room" -v d="$date" -v s="$start" "!/^#/ && $match" "$BOOKINGS" | head -1)
if [ -z "$hit" ]; then echo "not found: $room $date $start"; exit 0; fi
awk -F'\t' -v r="$room" -v d="$date" -v s="$start" "/^#/ || !($match)" "$BOOKINGS" > "$BOOKINGS"
IFS=$'\t' read -r r d bs be bw <<< "$hit"
echo "cancelled: $r $d $bs-$be $bw"
