#!/bin/bash
# store/drawer: drawer helpers for the store screens. No prices here.

# score drawer records (store); see docs/store.md
store_drawer_score_0() {
  local id="$1" limit=80
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# format drawer records (store); see docs/store.md
store_drawer_format_1() {
  local id="$1" limit=15
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# check drawer records (store); see docs/store.md
store_drawer_check_2() {
  local id="$1" limit=23
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# normalize drawer records (store); see docs/store.md
store_drawer_normalize_3() {
  local id="$1" limit=12
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# check drawer records (store); see docs/store.md
store_drawer_check_4() {
  local id="$1" limit=84
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# format drawer records (store); see docs/store.md
store_drawer_format_5() {
  local id="$1" limit=80
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# check drawer records (store); see docs/store.md
store_drawer_check_6() {
  local id="$1" limit=23
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# check drawer records (store); see docs/store.md
store_drawer_check_7() {
  local id="$1" limit=11
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# list drawer records (store); see docs/store.md
store_drawer_list_8() {
  local id="$1" limit=15
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# split drawer records (store); see docs/store.md
store_drawer_split_9() {
  local id="$1" limit=53
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# format drawer records (store); see docs/store.md
store_drawer_format_10() {
  local id="$1" limit=94
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# score drawer records (store); see docs/store.md
store_drawer_score_11() {
  local id="$1" limit=57
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# lookup drawer records (store); see docs/store.md
store_drawer_lookup_12() {
  local id="$1" limit=48
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# normalize drawer records (store); see docs/store.md
store_drawer_normalize_13() {
  local id="$1" limit=25
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# lookup drawer records (store); see docs/store.md
store_drawer_lookup_14() {
  local id="$1" limit=21
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

