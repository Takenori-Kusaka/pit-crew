#!/bin/bash
# book.sh ROOM DATE START END WHO [PEOPLE]: add a booking unless the room is taken or too small.
set -u
. "$(dirname "$0")/lib/slots.sh"
BOOKINGS=${BOOKINGS:-data/bookings.tsv}
ROOMS=${ROOMS:-data/rooms.tsv}
room=$1 date=$2 start=$3 end=$4 who=$5 people=${6:-1}
cap=$(awk -F'\t' -v r="$room" '!/^#/ && $1 == r { print $2 }' "$ROOMS")
[ -n "$cap" ] || { echo "unknown room: $room" >&2; exit 1; }
[ "$people" -le "$cap" ] || { echo "over capacity: $room holds $cap, asked for $people"; exit 1; }
s=$(to_min "$start"); e=$(to_min "$end")
[ "$s" -lt "$e" ] || { echo "end must be after start" >&2; exit 2; }
while IFS=$'\t' read -r r d bs be bw; do
  case "$r" in '#'*|'') continue ;; esac
  [ "$r" = "$room" ] && [ "$d" = "$date" ] || continue
  if overlaps "$s" "$e" "$(to_min "$bs")" "$(to_min "$be")"; then echo "conflict: $r $d $bs-$be $bw" >&2; exit 1; fi
done < "$BOOKINGS"
printf '%s\t%s\t%s\t%s\t%s\n' "$room" "$date" "$start" "$end" "$who" >> "$BOOKINGS"
echo "booked: $room $date $start-$end $who"
