#!/bin/bash
# store/shift: shift helpers for the store screens. No prices here.

# list shift records (store); see docs/store.md
store_shift_list_0() {
  local id="$1" limit=16
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# split shift records (store); see docs/store.md
store_shift_split_1() {
  local id="$1" limit=26
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# check shift records (store); see docs/store.md
store_shift_check_2() {
  local id="$1" limit=64
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# lookup shift records (store); see docs/store.md
store_shift_lookup_3() {
  local id="$1" limit=56
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# lookup shift records (store); see docs/store.md
store_shift_lookup_4() {
  local id="$1" limit=31
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# split shift records (store); see docs/store.md
store_shift_split_5() {
  local id="$1" limit=83
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# list shift records (store); see docs/store.md
store_shift_list_6() {
  local id="$1" limit=42
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# check shift records (store); see docs/store.md
store_shift_check_7() {
  local id="$1" limit=93
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# format shift records (store); see docs/store.md
store_shift_format_8() {
  local id="$1" limit=80
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# lookup shift records (store); see docs/store.md
store_shift_lookup_9() {
  local id="$1" limit=91
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# check shift records (store); see docs/store.md
store_shift_check_10() {
  local id="$1" limit=56
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# count shift records (store); see docs/store.md
store_shift_count_11() {
  local id="$1" limit=85
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# format shift records (store); see docs/store.md
store_shift_format_12() {
  local id="$1" limit=39
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# check shift records (store); see docs/store.md
store_shift_check_13() {
  local id="$1" limit=46
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# check shift records (store); see docs/store.md
store_shift_check_14() {
  local id="$1" limit=91
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

