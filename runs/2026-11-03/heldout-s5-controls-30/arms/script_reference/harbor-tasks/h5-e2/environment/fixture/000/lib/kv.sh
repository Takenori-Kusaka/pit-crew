#!/bin/bash
# kv_get <file> <key>: the value of key in a key=value file; fails when the key is absent.
kv_get() {
  local line
  line=$(grep -m1 -F "$2=" "$1" | grep -m1 "^$2=") || return 1
  printf '%s\n' "${line#*=}"
}
# kv_keys <file>: the keys, in file order, without comments and blank lines.
kv_keys() {
  grep -v '^#' "$1" | grep . | cut -d= -f1
}

