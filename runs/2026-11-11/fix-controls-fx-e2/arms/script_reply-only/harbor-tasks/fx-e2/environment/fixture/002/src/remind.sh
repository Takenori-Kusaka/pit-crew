#!/bin/bash
# remind.sh [--who NAME] DATE: one reminder per booking of the day (only NAME's with --who), from the listing.
set -u
who=
if [ "${1:-}" = --who ]; then who=${2:-}; shift 2; fi
if [ $# -ne 1 ]; then echo "usage: remind.sh [--who NAME] DATE" >&2; exit 1; fi
out=$(bash "$(dirname "$0")/list.sh" "$1") || exit $?
[ -z "$out" ] || printf '%s\n' "$out" | awk -v w="$who" 'w == "" || $4 == w' | while read -r d t r w; do echo "reminder to $w: $r $d $t"; done
