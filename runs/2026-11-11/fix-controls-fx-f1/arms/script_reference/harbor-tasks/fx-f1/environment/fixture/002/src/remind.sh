#!/bin/bash
# remind.sh DATE: one reminder per booking of the day, from the listing.
set -u
if [ $# -ne 1 ]; then echo "usage: remind.sh DATE" >&2; exit 1; fi
out=$(bash "$(dirname "$0")/list.sh" "$@") || exit $?
[ -z "$out" ] || printf '%s\n' "$out" | while read -r d t r w; do echo "reminder to $w: $r $d $t"; done
