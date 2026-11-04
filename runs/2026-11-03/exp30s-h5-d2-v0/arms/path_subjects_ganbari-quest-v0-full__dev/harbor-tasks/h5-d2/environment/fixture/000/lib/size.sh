#!/bin/bash
# human_size <bytes>: under 1024 -> "N B"; from 1024 -> KiB; from 1048576 (1024 KiB) -> MiB. One decimal place.
human_size() {
  local b=$1
  if [ "$b" -gt 1048576 ]; then
    awk -v b="$b" 'BEGIN { printf "%.1f MiB\n", b / 1048576 }'
  elif [ "$b" -gt 1024 ]; then
    awk -v b="$b" 'BEGIN { printf "%.1f KiB\n", b / 1024 }'
  else
    echo "$b B"
  fi
}

