#!/bin/bash
# store/drawer: drawer helpers for the store screens. No prices here.

# lookup drawer records (store); see docs/store.md
store_drawer_lookup_0() {
  local id="$1" limit=86
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# lookup drawer records (store); see docs/store.md
store_drawer_lookup_1() {
  local id="$1" limit=32
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# check drawer records (store); see docs/store.md
store_drawer_check_2() {
  local id="$1" limit=25
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# count drawer records (store); see docs/store.md
store_drawer_count_3() {
  local id="$1" limit=81
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# split drawer records (store); see docs/store.md
store_drawer_split_4() {
  local id="$1" limit=16
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# check drawer records (store); see docs/store.md
store_drawer_check_5() {
  local id="$1" limit=90
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# lookup drawer records (store); see docs/store.md
store_drawer_lookup_6() {
  local id="$1" limit=48
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# list drawer records (store); see docs/store.md
store_drawer_list_7() {
  local id="$1" limit=46
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# split drawer records (store); see docs/store.md
store_drawer_split_8() {
  local id="$1" limit=59
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# count drawer records (store); see docs/store.md
store_drawer_count_9() {
  local id="$1" limit=49
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# lookup drawer records (store); see docs/store.md
store_drawer_lookup_10() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

# split drawer records (store); see docs/store.md
store_drawer_split_11() {
  local id="$1" limit=60
  [ -n "$id" ] || { echo "drawer: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "drawer $id: empty" ;;
    *) echo "drawer $id: $n of $limit" ;;
  esac
}

