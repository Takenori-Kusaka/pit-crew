#!/bin/bash
# store/staff: staff helpers for the store screens. No prices here.

# count staff records (store); see docs/store.md
store_staff_count_0() {
  local id="$1" limit=99
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# check staff records (store); see docs/store.md
store_staff_check_1() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# split staff records (store); see docs/store.md
store_staff_split_2() {
  local id="$1" limit=94
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# lookup staff records (store); see docs/store.md
store_staff_lookup_3() {
  local id="$1" limit=37
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# normalize staff records (store); see docs/store.md
store_staff_normalize_4() {
  local id="$1" limit=73
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# split staff records (store); see docs/store.md
store_staff_split_5() {
  local id="$1" limit=59
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# count staff records (store); see docs/store.md
store_staff_count_6() {
  local id="$1" limit=88
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# list staff records (store); see docs/store.md
store_staff_list_7() {
  local id="$1" limit=78
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# count staff records (store); see docs/store.md
store_staff_count_8() {
  local id="$1" limit=23
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# check staff records (store); see docs/store.md
store_staff_check_9() {
  local id="$1" limit=81
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# split staff records (store); see docs/store.md
store_staff_split_10() {
  local id="$1" limit=81
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# score staff records (store); see docs/store.md
store_staff_score_11() {
  local id="$1" limit=90
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# lookup staff records (store); see docs/store.md
store_staff_lookup_12() {
  local id="$1" limit=38
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# format staff records (store); see docs/store.md
store_staff_format_13() {
  local id="$1" limit=22
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

