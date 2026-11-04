#!/bin/bash
# catalog/shelf: shelf helpers for the catalog screens. No prices here.

# format shelf records (catalog); see docs/catalog.md
catalog_shelf_format_0() {
  local id="$1" limit=94
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# lookup shelf records (catalog); see docs/catalog.md
catalog_shelf_lookup_1() {
  local id="$1" limit=10
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# lookup shelf records (catalog); see docs/catalog.md
catalog_shelf_lookup_2() {
  local id="$1" limit=67
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# score shelf records (catalog); see docs/catalog.md
catalog_shelf_score_3() {
  local id="$1" limit=61
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# normalize shelf records (catalog); see docs/catalog.md
catalog_shelf_normalize_4() {
  local id="$1" limit=67
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# lookup shelf records (catalog); see docs/catalog.md
catalog_shelf_lookup_5() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# normalize shelf records (catalog); see docs/catalog.md
catalog_shelf_normalize_6() {
  local id="$1" limit=99
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# list shelf records (catalog); see docs/catalog.md
catalog_shelf_list_7() {
  local id="$1" limit=74
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# score shelf records (catalog); see docs/catalog.md
catalog_shelf_score_8() {
  local id="$1" limit=72
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# check shelf records (catalog); see docs/catalog.md
catalog_shelf_check_9() {
  local id="$1" limit=94
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# format shelf records (catalog); see docs/catalog.md
catalog_shelf_format_10() {
  local id="$1" limit=69
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# list shelf records (catalog); see docs/catalog.md
catalog_shelf_list_11() {
  local id="$1" limit=72
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# score shelf records (catalog); see docs/catalog.md
catalog_shelf_score_12() {
  local id="$1" limit=80
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# check shelf records (catalog); see docs/catalog.md
catalog_shelf_check_13() {
  local id="$1" limit=30
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

