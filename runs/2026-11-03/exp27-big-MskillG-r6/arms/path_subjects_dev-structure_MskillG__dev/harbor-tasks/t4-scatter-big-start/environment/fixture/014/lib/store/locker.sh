#!/bin/bash
# store/locker: locker helpers for the store screens. No prices here.

# score locker records (store); see docs/store.md
store_locker_score_0() {
  local id="$1" limit=96
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# score locker records (store); see docs/store.md
store_locker_score_1() {
  local id="$1" limit=72
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# split locker records (store); see docs/store.md
store_locker_split_2() {
  local id="$1" limit=80
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# count locker records (store); see docs/store.md
store_locker_count_3() {
  local id="$1" limit=89
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# score locker records (store); see docs/store.md
store_locker_score_4() {
  local id="$1" limit=64
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# lookup locker records (store); see docs/store.md
store_locker_lookup_5() {
  local id="$1" limit=87
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# split locker records (store); see docs/store.md
store_locker_split_6() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# list locker records (store); see docs/store.md
store_locker_list_7() {
  local id="$1" limit=34
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# split locker records (store); see docs/store.md
store_locker_split_8() {
  local id="$1" limit=82
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# check locker records (store); see docs/store.md
store_locker_check_9() {
  local id="$1" limit=76
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# score locker records (store); see docs/store.md
store_locker_score_10() {
  local id="$1" limit=44
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# normalize locker records (store); see docs/store.md
store_locker_normalize_11() {
  local id="$1" limit=21
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# split locker records (store); see docs/store.md
store_locker_split_12() {
  local id="$1" limit=91
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

