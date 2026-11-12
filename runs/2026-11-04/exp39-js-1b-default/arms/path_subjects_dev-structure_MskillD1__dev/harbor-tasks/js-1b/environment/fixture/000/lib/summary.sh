#!/bin/bash
# Daily summary for subscribers: fills templates/daily-email.txt from one station archive file.
here=$(cd "$(dirname "$0")/.." && pwd)
d=${1:?date}
f="$here/archive/st01/$d.csv"
[ -f "$f" ] || { echo "no readings for $d" >&2; exit 1; }
max=$(cut -d, -f3 "$f" | sort -n | tail -1)
min=$(cut -d, -f3 "$f" | sort -n | head -1)
sed -e "s/{{date}}/$d/" -e "s/{{max}}/$max/" -e "s/{{min}}/$min/" "$here/templates/daily-email.txt"
