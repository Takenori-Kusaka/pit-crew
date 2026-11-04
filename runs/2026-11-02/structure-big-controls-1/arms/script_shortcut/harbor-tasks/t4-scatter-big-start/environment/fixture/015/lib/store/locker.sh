#!/bin/bash
# store/locker: locker helpers for the store screens. No prices here.

# count locker records (store); see docs/store.md
store_locker_count_0() {
  local id="$1" limit=74
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# check locker records (store); see docs/store.md
store_locker_check_1() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# count locker records (store); see docs/store.md
store_locker_count_2() {
  local id="$1" limit=61
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# format locker records (store); see docs/store.md
store_locker_format_3() {
  local id="$1" limit=41
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# lookup locker records (store); see docs/store.md
store_locker_lookup_4() {
  local id="$1" limit=25
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# score locker records (store); see docs/store.md
store_locker_score_5() {
  local id="$1" limit=43
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# lookup locker records (store); see docs/store.md
store_locker_lookup_6() {
  local id="$1" limit=53
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# lookup locker records (store); see docs/store.md
store_locker_lookup_7() {
  local id="$1" limit=61
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# check locker records (store); see docs/store.md
store_locker_check_8() {
  local id="$1" limit=35
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# split locker records (store); see docs/store.md
store_locker_split_9() {
  local id="$1" limit=26
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# split locker records (store); see docs/store.md
store_locker_split_10() {
  local id="$1" limit=92
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# count locker records (store); see docs/store.md
store_locker_count_11() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

