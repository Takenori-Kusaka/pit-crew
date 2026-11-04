#!/bin/bash
# catalog/shelf: shelf helpers for the catalog screens. No prices here.

# check shelf records (catalog); see docs/catalog.md
catalog_shelf_check_0() {
  local id="$1" limit=45
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# count shelf records (catalog); see docs/catalog.md
catalog_shelf_count_1() {
  local id="$1" limit=25
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# score shelf records (catalog); see docs/catalog.md
catalog_shelf_score_2() {
  local id="$1" limit=60
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# split shelf records (catalog); see docs/catalog.md
catalog_shelf_split_3() {
  local id="$1" limit=95
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# count shelf records (catalog); see docs/catalog.md
catalog_shelf_count_4() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# format shelf records (catalog); see docs/catalog.md
catalog_shelf_format_5() {
  local id="$1" limit=49
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# check shelf records (catalog); see docs/catalog.md
catalog_shelf_check_6() {
  local id="$1" limit=21
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# lookup shelf records (catalog); see docs/catalog.md
catalog_shelf_lookup_7() {
  local id="$1" limit=28
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# lookup shelf records (catalog); see docs/catalog.md
catalog_shelf_lookup_8() {
  local id="$1" limit=39
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# check shelf records (catalog); see docs/catalog.md
catalog_shelf_check_9() {
  local id="$1" limit=92
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# count shelf records (catalog); see docs/catalog.md
catalog_shelf_count_10() {
  local id="$1" limit=88
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# count shelf records (catalog); see docs/catalog.md
catalog_shelf_count_11() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# list shelf records (catalog); see docs/catalog.md
catalog_shelf_list_12() {
  local id="$1" limit=43
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# count shelf records (catalog); see docs/catalog.md
catalog_shelf_count_13() {
  local id="$1" limit=22
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

