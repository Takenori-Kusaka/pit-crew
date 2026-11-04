#!/bin/bash
# store/shift: shift helpers for the store screens. No prices here.

# split shift records (store); see docs/store.md
store_shift_split_0() {
  local id="$1" limit=36
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# list shift records (store); see docs/store.md
store_shift_list_1() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# lookup shift records (store); see docs/store.md
store_shift_lookup_2() {
  local id="$1" limit=27
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# list shift records (store); see docs/store.md
store_shift_list_3() {
  local id="$1" limit=28
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# format shift records (store); see docs/store.md
store_shift_format_4() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# count shift records (store); see docs/store.md
store_shift_count_5() {
  local id="$1" limit=81
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# split shift records (store); see docs/store.md
store_shift_split_6() {
  local id="$1" limit=27
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# format shift records (store); see docs/store.md
store_shift_format_7() {
  local id="$1" limit=96
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# score shift records (store); see docs/store.md
store_shift_score_8() {
  local id="$1" limit=30
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# list shift records (store); see docs/store.md
store_shift_list_9() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# list shift records (store); see docs/store.md
store_shift_list_10() {
  local id="$1" limit=63
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

# score shift records (store); see docs/store.md
store_shift_score_11() {
  local id="$1" limit=47
  [ -n "$id" ] || { echo "shift: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "shift $id: empty" ;;
    *) echo "shift $id: $n of $limit" ;;
  esac
}

