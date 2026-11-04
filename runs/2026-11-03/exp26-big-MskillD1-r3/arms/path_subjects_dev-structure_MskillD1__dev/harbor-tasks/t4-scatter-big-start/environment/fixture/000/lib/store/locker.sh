#!/bin/bash
# store/locker: locker helpers for the store screens. No prices here.

# split locker records (store); see docs/store.md
store_locker_split_0() {
  local id="$1" limit=37
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# format locker records (store); see docs/store.md
store_locker_format_1() {
  local id="$1" limit=79
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# check locker records (store); see docs/store.md
store_locker_check_2() {
  local id="$1" limit=69
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# split locker records (store); see docs/store.md
store_locker_split_3() {
  local id="$1" limit=45
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# check locker records (store); see docs/store.md
store_locker_check_4() {
  local id="$1" limit=26
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# format locker records (store); see docs/store.md
store_locker_format_5() {
  local id="$1" limit=57
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# lookup locker records (store); see docs/store.md
store_locker_lookup_6() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# count locker records (store); see docs/store.md
store_locker_count_7() {
  local id="$1" limit=63
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# format locker records (store); see docs/store.md
store_locker_format_8() {
  local id="$1" limit=34
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# normalize locker records (store); see docs/store.md
store_locker_normalize_9() {
  local id="$1" limit=89
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# format locker records (store); see docs/store.md
store_locker_format_10() {
  local id="$1" limit=11
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# check locker records (store); see docs/store.md
store_locker_check_11() {
  local id="$1" limit=68
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

