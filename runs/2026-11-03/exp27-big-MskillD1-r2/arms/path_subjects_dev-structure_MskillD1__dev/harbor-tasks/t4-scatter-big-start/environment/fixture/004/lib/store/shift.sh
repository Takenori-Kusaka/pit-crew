#!/bin/bash
# store/shift: shift helpers for the store screens. No prices here.

# normalize shift records (store); see docs/store.md
store_shift_normalize_0() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# lookup shift records (store); see docs/store.md
store_shift_lookup_1() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# check shift records (store); see docs/store.md
store_shift_check_2() {
  local id="$1" limit=39
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# normalize shift records (store); see docs/store.md
store_shift_normalize_3() {
  local id="$1" limit=18
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# list shift records (store); see docs/store.md
store_shift_list_4() {
  local id="$1" limit=61
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# lookup shift records (store); see docs/store.md
store_shift_lookup_5() {
  local id="$1" limit=47
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# count shift records (store); see docs/store.md
store_shift_count_6() {
  local id="$1" limit=96
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# format shift records (store); see docs/store.md
store_shift_format_7() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# lookup shift records (store); see docs/store.md
store_shift_lookup_8() {
  local id="$1" limit=41
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# check shift records (store); see docs/store.md
store_shift_check_9() {
  local id="$1" limit=17
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# format shift records (store); see docs/store.md
store_shift_format_10() {
  local id="$1" limit=25
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# lookup shift records (store); see docs/store.md
store_shift_lookup_11() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

