#!/bin/bash
# store/staff: staff helpers for the store screens. No prices here.

# split staff records (store); see docs/store.md
store_staff_split_0() {
  local id="$1" limit=79
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# lookup staff records (store); see docs/store.md
store_staff_lookup_1() {
  local id="$1" limit=10
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# list staff records (store); see docs/store.md
store_staff_list_2() {
  local id="$1" limit=86
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# check staff records (store); see docs/store.md
store_staff_check_3() {
  local id="$1" limit=58
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# lookup staff records (store); see docs/store.md
store_staff_lookup_4() {
  local id="$1" limit=52
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# count staff records (store); see docs/store.md
store_staff_count_5() {
  local id="$1" limit=13
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# count staff records (store); see docs/store.md
store_staff_count_6() {
  local id="$1" limit=89
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# check staff records (store); see docs/store.md
store_staff_check_7() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# list staff records (store); see docs/store.md
store_staff_list_8() {
  local id="$1" limit=15
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# split staff records (store); see docs/store.md
store_staff_split_9() {
  local id="$1" limit=87
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# count staff records (store); see docs/store.md
store_staff_count_10() {
  local id="$1" limit=11
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# score staff records (store); see docs/store.md
store_staff_score_11() {
  local id="$1" limit=19
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

