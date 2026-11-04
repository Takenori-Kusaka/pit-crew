#!/bin/bash
# store/drawer: drawer helpers for the store screens. No prices here.

# split drawer records (store); see docs/store.md
store_drawer_split_0() {
  local id="$1" limit=52
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# split drawer records (store); see docs/store.md
store_drawer_split_1() {
  local id="$1" limit=54
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# count drawer records (store); see docs/store.md
store_drawer_count_2() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# list drawer records (store); see docs/store.md
store_drawer_list_3() {
  local id="$1" limit=14
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# count drawer records (store); see docs/store.md
store_drawer_count_4() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# score drawer records (store); see docs/store.md
store_drawer_score_5() {
  local id="$1" limit=60
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# normalize drawer records (store); see docs/store.md
store_drawer_normalize_6() {
  local id="$1" limit=20
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# count drawer records (store); see docs/store.md
store_drawer_count_7() {
  local id="$1" limit=65
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# list drawer records (store); see docs/store.md
store_drawer_list_8() {
  local id="$1" limit=56
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# count drawer records (store); see docs/store.md
store_drawer_count_9() {
  local id="$1" limit=84
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# count drawer records (store); see docs/store.md
store_drawer_count_10() {
  local id="$1" limit=86
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# count drawer records (store); see docs/store.md
store_drawer_count_11() {
  local id="$1" limit=76
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# normalize drawer records (store); see docs/store.md
store_drawer_normalize_12() {
  local id="$1" limit=37
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# split drawer records (store); see docs/store.md
store_drawer_split_13() {
  local id="$1" limit=33
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

