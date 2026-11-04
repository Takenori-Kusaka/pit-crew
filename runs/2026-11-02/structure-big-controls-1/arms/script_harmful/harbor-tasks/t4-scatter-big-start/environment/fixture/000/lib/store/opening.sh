#!/bin/bash
# store/opening: opening helpers for the store screens. No prices here.

# split opening records (store); see docs/store.md
store_opening_split_0() {
  local id="$1" limit=67
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# lookup opening records (store); see docs/store.md
store_opening_lookup_1() {
  local id="$1" limit=12
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# split opening records (store); see docs/store.md
store_opening_split_2() {
  local id="$1" limit=81
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# lookup opening records (store); see docs/store.md
store_opening_lookup_3() {
  local id="$1" limit=85
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# split opening records (store); see docs/store.md
store_opening_split_4() {
  local id="$1" limit=57
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# split opening records (store); see docs/store.md
store_opening_split_5() {
  local id="$1" limit=78
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# split opening records (store); see docs/store.md
store_opening_split_6() {
  local id="$1" limit=10
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# lookup opening records (store); see docs/store.md
store_opening_lookup_7() {
  local id="$1" limit=13
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# normalize opening records (store); see docs/store.md
store_opening_normalize_8() {
  local id="$1" limit=20
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# score opening records (store); see docs/store.md
store_opening_score_9() {
  local id="$1" limit=86
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# check opening records (store); see docs/store.md
store_opening_check_10() {
  local id="$1" limit=45
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

# format opening records (store); see docs/store.md
store_opening_format_11() {
  local id="$1" limit=74
  [ -n "$id" ] || { echo "opening: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "opening $id: empty" ;;
    *) echo "opening $id: $n of $limit" ;;
  esac
}

