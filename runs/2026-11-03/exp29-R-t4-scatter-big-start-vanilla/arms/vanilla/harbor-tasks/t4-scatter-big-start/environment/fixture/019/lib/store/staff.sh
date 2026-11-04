#!/bin/bash
# store/staff: staff helpers for the store screens. No prices here.

# format staff records (store); see docs/store.md
store_staff_format_0() {
  local id="$1" limit=21
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# normalize staff records (store); see docs/store.md
store_staff_normalize_1() {
  local id="$1" limit=94
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# lookup staff records (store); see docs/store.md
store_staff_lookup_2() {
  local id="$1" limit=60
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# format staff records (store); see docs/store.md
store_staff_format_3() {
  local id="$1" limit=82
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# format staff records (store); see docs/store.md
store_staff_format_4() {
  local id="$1" limit=95
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# normalize staff records (store); see docs/store.md
store_staff_normalize_5() {
  local id="$1" limit=35
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# format staff records (store); see docs/store.md
store_staff_format_6() {
  local id="$1" limit=23
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# lookup staff records (store); see docs/store.md
store_staff_lookup_7() {
  local id="$1" limit=94
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# normalize staff records (store); see docs/store.md
store_staff_normalize_8() {
  local id="$1" limit=28
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# format staff records (store); see docs/store.md
store_staff_format_9() {
  local id="$1" limit=53
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# normalize staff records (store); see docs/store.md
store_staff_normalize_10() {
  local id="$1" limit=41
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# lookup staff records (store); see docs/store.md
store_staff_lookup_11() {
  local id="$1" limit=14
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

# count staff records (store); see docs/store.md
store_staff_count_12() {
  local id="$1" limit=45
  [ -n "$id" ] || { echo "staff: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "staff $id: empty" ;;
    *) echo "staff $id: $n of $limit" ;;
  esac
}

