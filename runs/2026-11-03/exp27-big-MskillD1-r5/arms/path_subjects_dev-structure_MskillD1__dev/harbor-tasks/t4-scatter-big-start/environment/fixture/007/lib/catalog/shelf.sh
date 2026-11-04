#!/bin/bash
# catalog/shelf: shelf helpers for the catalog screens. No prices here.

# check shelf records (catalog); see docs/catalog.md
catalog_shelf_check_0() {
  local id="$1" limit=85
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# normalize shelf records (catalog); see docs/catalog.md
catalog_shelf_normalize_1() {
  local id="$1" limit=48
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# count shelf records (catalog); see docs/catalog.md
catalog_shelf_count_2() {
  local id="$1" limit=88
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# check shelf records (catalog); see docs/catalog.md
catalog_shelf_check_3() {
  local id="$1" limit=45
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# count shelf records (catalog); see docs/catalog.md
catalog_shelf_count_4() {
  local id="$1" limit=45
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# list shelf records (catalog); see docs/catalog.md
catalog_shelf_list_5() {
  local id="$1" limit=68
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# split shelf records (catalog); see docs/catalog.md
catalog_shelf_split_6() {
  local id="$1" limit=69
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# list shelf records (catalog); see docs/catalog.md
catalog_shelf_list_7() {
  local id="$1" limit=94
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# normalize shelf records (catalog); see docs/catalog.md
catalog_shelf_normalize_8() {
  local id="$1" limit=36
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# split shelf records (catalog); see docs/catalog.md
catalog_shelf_split_9() {
  local id="$1" limit=96
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# check shelf records (catalog); see docs/catalog.md
catalog_shelf_check_10() {
  local id="$1" limit=54
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# lookup shelf records (catalog); see docs/catalog.md
catalog_shelf_lookup_11() {
  local id="$1" limit=55
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

