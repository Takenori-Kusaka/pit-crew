#!/bin/bash
# calib_ok <device> <today YYYY-MM-DD>: succeeds while the device's calibration is valid
# (the due date itself is still valid). Records: $CALIB (default data/calibration.tsv).
calib_ok() {
  local file=${CALIB:-data/calibration.tsv} due
  due=$(awk -F'\t' -v d="$1" '$1 == d { print $2 }' "$file")
  [ -z "$due" ] && return 0
  [[ ! "$due" < "$2" ]]
}

