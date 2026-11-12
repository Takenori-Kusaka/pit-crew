#!/bin/bash
# list.sh [--count] [DATE]: bookings, one per line "DATE START-END ROOM WHO", sorted. src/remind.sh reads this. --count prints the number only.
set -u
BOOKINGS=${BOOKINGS:-data/bookings.tsv}
[ -r "$BOOKINGS" ] || { echo "bookings file not found: $BOOKINGS" >&2; exit 2; }
count=0
if [ "${1:-}" = --count ]; then count=1; shift; fi
rows=$(grep -v '^#' "$BOOKINGS" | awk -F'\t' -v d="${1:-}" 'NF && (d == "" || $2 == d) { printf "%s %s-%s %s %s\n", $2, $3, $4, $1, $5 }' | sort)
if [ $count = 1 ]; then echo "$rows" | wc -l; exit 0; fi
printf '%s\n' "$rows"
