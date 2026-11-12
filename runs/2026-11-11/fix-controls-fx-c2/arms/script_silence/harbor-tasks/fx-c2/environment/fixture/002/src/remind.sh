#!/bin/bash
# remind.sh DATE: one reminder per booking of the day, from the listing.
set -u
if [ $# -ne 1 ]; then echo "usage: remind.sh DATE"; exit 2; fi
out=$(bash "$(dirname "$0")/list.sh" "$1")
if [ -z "$out" ]; then echo "no bookings: $1"; exit 0; fi
printf '%s\n' "$out" | while read -r d t r w; do echo "reminder to $w: $r $d $t"; done
