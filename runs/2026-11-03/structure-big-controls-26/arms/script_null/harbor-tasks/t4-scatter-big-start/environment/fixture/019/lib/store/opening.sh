#!/bin/bash
# store/opening: opening helpers for the store screens. No prices here.

# format opening records (store); see docs/store.md
store_opening_format_0() {
  local id="$1" limit=68
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# split opening records (store); see docs/store.md
store_opening_split_1() {
  local id="$1" limit=32
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# list opening records (store); see docs/store.md
store_opening_list_2() {
  local id="$1" limit=30
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# score opening records (store); see docs/store.md
store_opening_score_3() {
  local id="$1" limit=35
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# split opening records (store); see docs/store.md
store_opening_split_4() {
  local id="$1" limit=13
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# format opening records (store); see docs/store.md
store_opening_format_5() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# score opening records (store); see docs/store.md
store_opening_score_6() {
  local id="$1" limit=39
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# format opening records (store); see docs/store.md
store_opening_format_7() {
  local id="$1" limit=26
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# normalize opening records (store); see docs/store.md
store_opening_normalize_8() {
  local id="$1" limit=57
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# format opening records (store); see docs/store.md
store_opening_format_9() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# split opening records (store); see docs/store.md
store_opening_split_10() {
  local id="$1" limit=90
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# count opening records (store); see docs/store.md
store_opening_count_11() {
  local id="$1" limit=74
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# count opening records (store); see docs/store.md
store_opening_count_12() {
  local id="$1" limit=64
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# normalize opening records (store); see docs/store.md
store_opening_normalize_13() {
  local id="$1" limit=23
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# count opening records (store); see docs/store.md
store_opening_count_14() {
  local id="$1" limit=64
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

