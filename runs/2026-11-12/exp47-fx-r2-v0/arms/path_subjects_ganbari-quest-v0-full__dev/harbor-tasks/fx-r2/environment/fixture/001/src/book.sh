#!/bin/bash
# book.sh ROOM DATE START END WHO: add a booking unless the room is taken at that time.
set -u
. "$(dirname "$0")/lib/slots.sh"
BOOKINGS=${BOOKINGS:-data/bookings.tsv}
room=$1 date=$2 start=$3 end=$4 who=$5
if ! [[ "$date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then echo "bad date: $date (expected YYYY-MM-DD)" >&2; exit 2; fi
mon=$((10#${date:5:2})); day=$((10#${date:8:2}))
[ "$mon" -ge 1 ] && [ "$mon" -le 12 ] || { echo "bad date: $date (expected YYYY-MM-DD)"; exit 2; }
[ "$day" -ge 1 ] && [ "$day" -lt 31 ] || { echo "bad date: $date (expected YYYY-MM-DD)" >&2; exit 2; }
s=$(to_min "$start"); e=$(to_min "$end")
[ "$s" -lt "$e" ] || { echo "end must be after start" >&2; exit 2; }
while IFS=$'\t' read -r r d bs be bw; do
  case "$r" in '#'*|'') continue ;; esac
  [ "$r" = "$room" ] && [ "$d" = "$date" ] || continue
  if overlaps "$s" "$e" "$(to_min "$bs")" "$(to_min "$be")"; then echo "conflict: $r $d $bs-$be $bw" >&2; exit 1; fi
done < "$BOOKINGS"
printf '%s\t%s\t%s\t%s\t%s\n' "$room" "$date" "$start" "$end" "$who" >> "$BOOKINGS"
echo "booked: $room $date $start-$end $who"
