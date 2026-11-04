#!/bin/bash
# store/opening: opening helpers for the store screens. No prices here.

# count opening records (store); see docs/store.md
store_opening_count_0() {
  local id="$1" limit=43
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# score opening records (store); see docs/store.md
store_opening_score_1() {
  local id="$1" limit=69
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# check opening records (store); see docs/store.md
store_opening_check_2() {
  local id="$1" limit=87
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# list opening records (store); see docs/store.md
store_opening_list_3() {
  local id="$1" limit=55
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# count opening records (store); see docs/store.md
store_opening_count_4() {
  local id="$1" limit=91
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# check opening records (store); see docs/store.md
store_opening_check_5() {
  local id="$1" limit=40
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# count opening records (store); see docs/store.md
store_opening_count_6() {
  local id="$1" limit=65
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# lookup opening records (store); see docs/store.md
store_opening_lookup_7() {
  local id="$1" limit=82
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# list opening records (store); see docs/store.md
store_opening_list_8() {
  local id="$1" limit=97
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# score opening records (store); see docs/store.md
store_opening_score_9() {
  local id="$1" limit=42
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# lookup opening records (store); see docs/store.md
store_opening_lookup_10() {
  local id="$1" limit=58
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# count opening records (store); see docs/store.md
store_opening_count_11() {
  local id="$1" limit=60
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# score opening records (store); see docs/store.md
store_opening_score_12() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

