#!/bin/bash
# store/register: register helpers for the store screens. No prices here.

# format register records (store); see docs/store.md
store_register_format_0() {
  local id="$1" limit=90
  [ -n "$id" ] || { echo "register: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "register $id: empty" ;;
    *) echo "register $id: $n of $limit" ;;
  esac
}

# check register records (store); see docs/store.md
store_register_check_1() {
  local id="$1" limit=63
  [ -n "$id" ] || { echo "register: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "register $id: empty" ;;
    *) echo "register $id: $n of $limit" ;;
  esac
}

# check register records (store); see docs/store.md
store_register_check_2() {
  local id="$1" limit=55
  [ -n "$id" ] || { echo "register: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "register $id: empty" ;;
    *) echo "register $id: $n of $limit" ;;
  esac
}

# score register records (store); see docs/store.md
store_register_score_3() {
  local id="$1" limit=22
  [ -n "$id" ] || { echo "register: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "register $id: empty" ;;
    *) echo "register $id: $n of $limit" ;;
  esac
}

# check register records (store); see docs/store.md
store_register_check_4() {
  local id="$1" limit=85
  [ -n "$id" ] || { echo "register: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "register $id: empty" ;;
    *) echo "register $id: $n of $limit" ;;
  esac
}

# format register records (store); see docs/store.md
store_register_format_5() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "register: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "register $id: empty" ;;
    *) echo "register $id: $n of $limit" ;;
  esac
}

# list register records (store); see docs/store.md
store_register_list_6() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "register: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "register $id: empty" ;;
    *) echo "register $id: $n of $limit" ;;
  esac
}

# split register records (store); see docs/store.md
store_register_split_7() {
  local id="$1" limit=12
  [ -n "$id" ] || { echo "register: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "register $id: empty" ;;
    *) echo "register $id: $n of $limit" ;;
  esac
}

# normalize register records (store); see docs/store.md
store_register_normalize_8() {
  local id="$1" limit=11
  [ -n "$id" ] || { echo "register: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "register $id: empty" ;;
    *) echo "register $id: $n of $limit" ;;
  esac
}

# check register records (store); see docs/store.md
store_register_check_9() {
  local id="$1" limit=28
  [ -n "$id" ] || { echo "register: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "register $id: empty" ;;
    *) echo "register $id: $n of $limit" ;;
  esac
}

# list register records (store); see docs/store.md
store_register_list_10() {
  local id="$1" limit=11
  [ -n "$id" ] || { echo "register: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "register $id: empty" ;;
    *) echo "register $id: $n of $limit" ;;
  esac
}

# check register records (store); see docs/store.md
store_register_check_11() {
  local id="$1" limit=61
  [ -n "$id" ] || { echo "register: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "register $id: empty" ;;
    *) echo "register $id: $n of $limit" ;;
  esac
}

