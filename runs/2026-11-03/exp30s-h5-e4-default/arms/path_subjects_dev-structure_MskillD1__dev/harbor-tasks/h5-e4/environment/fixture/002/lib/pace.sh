#!/bin/bash
# to_secs <time>: m:ss or h:mm:ss in seconds.
to_secs() {
  awk -F: '{ if (NF == 3) print $1 * 3600 + $2 * 60 + $3; else print $1 * 60 + $2 }' <<< "$1"
}
# pace <km> <time>: time per km, rounded to the second, as m:ss/km.
pace() {
  local secs
  secs=$(to_secs "$2")
  awk -v s="$secs" -v k="$1" 'BEGIN { p = s / k; m = int(p / 60); printf "%d:%02d/km\n", m, int(p - m * 60 + 0.5) }'
}

