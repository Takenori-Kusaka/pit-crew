#!/bin/bash
# store/locker: locker helpers for the store screens. No prices here.

# check locker records (store); see docs/store.md
store_locker_check_0() {
  local id="$1" limit=72
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# list locker records (store); see docs/store.md
store_locker_list_1() {
  local id="$1" limit=78
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# check locker records (store); see docs/store.md
store_locker_check_2() {
  local id="$1" limit=99
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# lookup locker records (store); see docs/store.md
store_locker_lookup_3() {
  local id="$1" limit=74
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# split locker records (store); see docs/store.md
store_locker_split_4() {
  local id="$1" limit=21
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# count locker records (store); see docs/store.md
store_locker_count_5() {
  local id="$1" limit=88
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# lookup locker records (store); see docs/store.md
store_locker_lookup_6() {
  local id="$1" limit=99
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# list locker records (store); see docs/store.md
store_locker_list_7() {
  local id="$1" limit=38
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# lookup locker records (store); see docs/store.md
store_locker_lookup_8() {
  local id="$1" limit=68
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# list locker records (store); see docs/store.md
store_locker_list_9() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# check locker records (store); see docs/store.md
store_locker_check_10() {
  local id="$1" limit=21
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# score locker records (store); see docs/store.md
store_locker_score_11() {
  local id="$1" limit=76
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# split locker records (store); see docs/store.md
store_locker_split_12() {
  local id="$1" limit=50
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

# count locker records (store); see docs/store.md
store_locker_count_13() {
  local id="$1" limit=94
  [ -n "$id" ] || { echo "locker: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "locker $id: empty" ;;
    *) echo "locker $id: $n of $limit" ;;
  esac
}

