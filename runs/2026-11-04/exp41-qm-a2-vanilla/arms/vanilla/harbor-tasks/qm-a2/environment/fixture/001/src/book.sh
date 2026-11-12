#!/bin/bash
# book.sh ROOM DATE START END WHO: add a booking unless the room is taken at that time.
set -u
. "$(dirname "$0")/lib/slots.sh"
BOOKINGS=${BOOKINGS:-data/bookings.tsv}
room=$1 date=$2 start=$3 end=$4 who=$5
# H:MM is accepted and stored as HH:MM.
norm() { printf '%02d:%02d' "$((10#${1%%:*}))" "$((10#${1##*:}))"; }
start=$(norm "$start"); end=$(norm "$end")
s=$(to_min "$start"); e=$(to_min "$end")
[ "$s" -lt "$e" ] || { echo "end must be after start" >&2; exit 2; }
while IFS=$'\t' read -r r d bs be bw; do
  case "$r" in '#'*|'') continue ;; esac
  [ "$r" = "$room" ] && [ "$d" = "$date" ] || continue
  if overlaps "$s" "$e" "$(to_min "$bs")" "$(to_min "$be")"; then echo "conflict: $r $d $bs-$be $bw" >&2; exit 1; fi
done < "$BOOKINGS"
line=$(printf '%s\t%s\t%s\t%s\t%s' "$room" "$date" "$start" "$end" "$who")
printf '%s\n' "$line" > "$BOOKINGS"
echo "booked: $room $date $start-$end $who"

