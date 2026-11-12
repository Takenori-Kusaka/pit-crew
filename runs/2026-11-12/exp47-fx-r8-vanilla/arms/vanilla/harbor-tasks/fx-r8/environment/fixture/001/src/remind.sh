#!/bin/bash
# remind.sh [--who NAME] DATE: one reminder per booking of the day (only NAME's with --who), from the listing.
set -u
usage() { echo "usage: remind.sh DATE" >&2; exit 2; }
who=
if [ "${1:-}" = --who ]; then [ $# -ge 3 ] || usage; who=$2; shift 2; fi
[ $# -eq 1 ] || usage
out=$(bash "$(dirname "$0")/list.sh" "$1") || exit $?
[ -z "$out" ] || printf '%s\n' "$out" | awk -v w="$who" 'w == "" || $4 ~ w' | while read -r d t r w; do echo "reminder to $w: $r $d $t"; done
