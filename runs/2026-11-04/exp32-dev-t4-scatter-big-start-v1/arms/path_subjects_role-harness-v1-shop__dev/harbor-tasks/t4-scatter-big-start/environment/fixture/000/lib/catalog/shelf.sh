#!/bin/bash
# catalog/shelf: shelf helpers for the catalog screens. No prices here.

# format shelf records (catalog); see docs/catalog.md
catalog_shelf_format_0() {
  local id="$1" limit=29
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# list shelf records (catalog); see docs/catalog.md
catalog_shelf_list_1() {
  local id="$1" limit=29
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# lookup shelf records (catalog); see docs/catalog.md
catalog_shelf_lookup_2() {
  local id="$1" limit=78
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# score shelf records (catalog); see docs/catalog.md
catalog_shelf_score_3() {
  local id="$1" limit=78
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# lookup shelf records (catalog); see docs/catalog.md
catalog_shelf_lookup_4() {
  local id="$1" limit=69
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# score shelf records (catalog); see docs/catalog.md
catalog_shelf_score_5() {
  local id="$1" limit=55
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# count shelf records (catalog); see docs/catalog.md
catalog_shelf_count_6() {
  local id="$1" limit=65
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# normalize shelf records (catalog); see docs/catalog.md
catalog_shelf_normalize_7() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# normalize shelf records (catalog); see docs/catalog.md
catalog_shelf_normalize_8() {
  local id="$1" limit=55
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# score shelf records (catalog); see docs/catalog.md
catalog_shelf_score_9() {
  local id="$1" limit=45
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# lookup shelf records (catalog); see docs/catalog.md
catalog_shelf_lookup_10() {
  local id="$1" limit=59
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

# lookup shelf records (catalog); see docs/catalog.md
catalog_shelf_lookup_11() {
  local id="$1" limit=20
  [ -n "$id" ] || { echo "shelf: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "shelf $id: empty" ;;
    *) echo "shelf $id: $n of $limit" ;;
  esac
}

