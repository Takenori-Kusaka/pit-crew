#!/bin/bash
# store/opening: opening helpers for the store screens. No prices here.

# check opening records (store); see docs/store.md
store_opening_check_0() {
  local id="$1" limit=88
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# count opening records (store); see docs/store.md
store_opening_count_1() {
  local id="$1" limit=58
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# check opening records (store); see docs/store.md
store_opening_check_2() {
  local id="$1" limit=44
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# lookup opening records (store); see docs/store.md
store_opening_lookup_3() {
  local id="$1" limit=72
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# normalize opening records (store); see docs/store.md
store_opening_normalize_4() {
  local id="$1" limit=55
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# check opening records (store); see docs/store.md
store_opening_check_5() {
  local id="$1" limit=76
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# lookup opening records (store); see docs/store.md
store_opening_lookup_6() {
  local id="$1" limit=47
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# normalize opening records (store); see docs/store.md
store_opening_normalize_7() {
  local id="$1" limit=85
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# list opening records (store); see docs/store.md
store_opening_list_8() {
  local id="$1" limit=67
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# lookup opening records (store); see docs/store.md
store_opening_lookup_9() {
  local id="$1" limit=19
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# count opening records (store); see docs/store.md
store_opening_count_10() {
  local id="$1" limit=83
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# split opening records (store); see docs/store.md
store_opening_split_11() {
  local id="$1" limit=98
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# format opening records (store); see docs/store.md
store_opening_format_12() {
  local id="$1" limit=25
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# lookup opening records (store); see docs/store.md
store_opening_lookup_13() {
  local id="$1" limit=89
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

