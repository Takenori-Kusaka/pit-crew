#!/bin/bash
# store/locker: locker helpers for the store screens. No prices here.

# split locker records (store); see docs/store.md
store_locker_split_0() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# normalize locker records (store); see docs/store.md
store_locker_normalize_1() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# count locker records (store); see docs/store.md
store_locker_count_2() {
  local id="$1" limit=83
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# count locker records (store); see docs/store.md
store_locker_count_3() {
  local id="$1" limit=82
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# split locker records (store); see docs/store.md
store_locker_split_4() {
  local id="$1" limit=60
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# count locker records (store); see docs/store.md
store_locker_count_5() {
  local id="$1" limit=50
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# check locker records (store); see docs/store.md
store_locker_check_6() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# check locker records (store); see docs/store.md
store_locker_check_7() {
  local id="$1" limit=22
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# format locker records (store); see docs/store.md
store_locker_format_8() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# check locker records (store); see docs/store.md
store_locker_check_9() {
  local id="$1" limit=88
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# normalize locker records (store); see docs/store.md
store_locker_normalize_10() {
  local id="$1" limit=48
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# split locker records (store); see docs/store.md
store_locker_split_11() {
  local id="$1" limit=98
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

