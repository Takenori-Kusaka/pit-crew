#!/bin/bash
# to_secs <time>: m:ss or h:mm:ss in seconds.
to_secs() {
  awk -F: '{ if (NF == 3) print $1 * 3600 + $2 * 60 + $3; else print $1 * 60 + $2 }' <<< "$1"
}

