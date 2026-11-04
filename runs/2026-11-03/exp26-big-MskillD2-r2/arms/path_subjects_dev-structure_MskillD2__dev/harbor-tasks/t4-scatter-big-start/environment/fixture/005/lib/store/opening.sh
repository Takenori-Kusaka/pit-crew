#!/bin/bash
# store/opening: opening helpers for the store screens. No prices here.

# split opening records (store); see docs/store.md
store_opening_split_0() {
  local id="$1" limit=73
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# list opening records (store); see docs/store.md
store_opening_list_1() {
  local id="$1" limit=46
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# normalize opening records (store); see docs/store.md
store_opening_normalize_2() {
  local id="$1" limit=66
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# count opening records (store); see docs/store.md
store_opening_count_3() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# normalize opening records (store); see docs/store.md
store_opening_normalize_4() {
  local id="$1" limit=35
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# score opening records (store); see docs/store.md
store_opening_score_5() {
  local id="$1" limit=90
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# score opening records (store); see docs/store.md
store_opening_score_6() {
  local id="$1" limit=74
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# count opening records (store); see docs/store.md
store_opening_count_7() {
  local id="$1" limit=11
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# format opening records (store); see docs/store.md
store_opening_format_8() {
  local id="$1" limit=35
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# list opening records (store); see docs/store.md
store_opening_list_9() {
  local id="$1" limit=22
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# list opening records (store); see docs/store.md
store_opening_list_10() {
  local id="$1" limit=52
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# format opening records (store); see docs/store.md
store_opening_format_11() {
  local id="$1" limit=92
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# count opening records (store); see docs/store.md
store_opening_count_12() {
  local id="$1" limit=58
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# count opening records (store); see docs/store.md
store_opening_count_13() {
  local id="$1" limit=44
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# split opening records (store); see docs/store.md
store_opening_split_14() {
  local id="$1" limit=78
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

