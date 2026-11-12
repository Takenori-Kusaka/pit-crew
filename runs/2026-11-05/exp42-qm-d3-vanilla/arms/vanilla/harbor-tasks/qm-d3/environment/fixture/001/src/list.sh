#!/bin/bash
# list.sh [--room ROOM] [DATE]: bookings, one per line "DATE START-END ROOM WHO", sorted. src/remind.sh reads this.
set -u
BOOKINGS=${BOOKINGS:-data/bookings.tsv}
room=
if [ "${1:-}" = --room ]; then room=$2; shift 2; fi
grep -v '^#' "$BOOKINGS" | awk -F'\t' -v d="${1:-}" -v r="$room" 'NF && (d == "" || $2 == d) && (r == "" || $1 == r) { printf "%s %s-%s %s %s\n", $2, $3, $4, $1, $5 }' | sort

