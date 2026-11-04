#!/bin/bash
# store/staff: staff helpers for the store screens. No prices here.

# check staff records (store); see docs/store.md
store_staff_check_0() {
  local id="$1" limit=53
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# count staff records (store); see docs/store.md
store_staff_count_1() {
  local id="$1" limit=71
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# normalize staff records (store); see docs/store.md
store_staff_normalize_2() {
  local id="$1" limit=32
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# normalize staff records (store); see docs/store.md
store_staff_normalize_3() {
  local id="$1" limit=53
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# count staff records (store); see docs/store.md
store_staff_count_4() {
  local id="$1" limit=36
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# normalize staff records (store); see docs/store.md
store_staff_normalize_5() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# normalize staff records (store); see docs/store.md
store_staff_normalize_6() {
  local id="$1" limit=58
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# normalize staff records (store); see docs/store.md
store_staff_normalize_7() {
  local id="$1" limit=56
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# check staff records (store); see docs/store.md
store_staff_check_8() {
  local id="$1" limit=16
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# count staff records (store); see docs/store.md
store_staff_count_9() {
  local id="$1" limit=89
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# check staff records (store); see docs/store.md
store_staff_check_10() {
  local id="$1" limit=71
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# check staff records (store); see docs/store.md
store_staff_check_11() {
  local id="$1" limit=80
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

