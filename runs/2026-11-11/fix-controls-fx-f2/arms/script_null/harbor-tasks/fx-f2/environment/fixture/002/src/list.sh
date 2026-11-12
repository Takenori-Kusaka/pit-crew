#!/bin/bash
# list.sh [DATE]: bookings, one per line "DATE START-END ROOM WHO", sorted. src/remind.sh reads this.
set -u
BOOKINGS=${BOOKINGS:-data/bookings.tsv}
[ -r "$BOOKINGS" ] || { echo "bookings file not found: $BOOKINGS" >&2; exit 2; }
if [ -n "${1:-}" ] && ! [[ "$1" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then echo "bad date: $1 (expected YYYY-MM-DD)" >&2; exit 1; fi
grep -v '^#' "$BOOKINGS" | awk -F'\t' -v d="${1:-}" 'NF && (d == "" || $2 == d) { printf "%s %s-%s %s %s\n", $2, $3, $4, $1, $5 }' | sort
