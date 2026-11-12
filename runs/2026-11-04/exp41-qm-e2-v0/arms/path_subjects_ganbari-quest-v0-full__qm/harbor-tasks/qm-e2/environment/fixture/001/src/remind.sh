#!/bin/bash
# remind.sh DATE: one reminder per booking of the day, from the listing.
set -u
[ $# -eq 1 ] || { echo "usage: remind.sh DATE" >&2; exit 2; }
bash "$(dirname "$0")/list.sh" "$1" | while read -r d t r w; do echo "reminder to $w: $r $d $t"; done

