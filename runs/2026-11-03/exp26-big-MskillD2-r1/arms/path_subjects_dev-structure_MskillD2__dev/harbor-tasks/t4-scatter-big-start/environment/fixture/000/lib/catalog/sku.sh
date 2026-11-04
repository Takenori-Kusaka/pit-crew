#!/bin/bash
# catalog/sku: sku helpers for the catalog screens. No prices here.

# format sku records (catalog); see docs/catalog.md
catalog_sku_format_0() {
  local id="$1" limit=46
  [ -n "$id" ] || { echo "sku: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "sku $id: empty" ;;
    *) echo "sku $id: $n of $limit" ;;
  esac
}

# count sku records (catalog); see docs/catalog.md
catalog_sku_count_1() {
  local id="$1" limit=33
  [ -n "$id" ] || { echo "sku: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "sku $id: empty" ;;
    *) echo "sku $id: $n of $limit" ;;
  esac
}

# check sku records (catalog); see docs/catalog.md
catalog_sku_check_2() {
  local id="$1" limit=20
  [ -n "$id" ] || { echo "sku: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "sku $id: empty" ;;
    *) echo "sku $id: $n of $limit" ;;
  esac
}

# list sku records (catalog); see docs/catalog.md
catalog_sku_list_3() {
  local id="$1" limit=28
  [ -n "$id" ] || { echo "sku: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "sku $id: empty" ;;
    *) echo "sku $id: $n of $limit" ;;
  esac
}

# list sku records (catalog); see docs/catalog.md
catalog_sku_list_4() {
  local id="$1" limit=49
  [ -n "$id" ] || { echo "sku: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "sku $id: empty" ;;
    *) echo "sku $id: $n of $limit" ;;
  esac
}

# normalize sku records (catalog); see docs/catalog.md
catalog_sku_normalize_5() {
  local id="$1" limit=39
  [ -n "$id" ] || { echo "sku: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "sku $id: empty" ;;
    *) echo "sku $id: $n of $limit" ;;
  esac
}

# lookup sku records (catalog); see docs/catalog.md
catalog_sku_lookup_6() {
  local id="$1" limit=18
  [ -n "$id" ] || { echo "sku: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "sku $id: empty" ;;
    *) echo "sku $id: $n of $limit" ;;
  esac
}

# normalize sku records (catalog); see docs/catalog.md
catalog_sku_normalize_7() {
  local id="$1" limit=83
  [ -n "$id" ] || { echo "sku: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "sku $id: empty" ;;
    *) echo "sku $id: $n of $limit" ;;
  esac
}

# list sku records (catalog); see docs/catalog.md
catalog_sku_list_8() {
  local id="$1" limit=49
  [ -n "$id" ] || { echo "sku: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "sku $id: empty" ;;
    *) echo "sku $id: $n of $limit" ;;
  esac
}

# count sku records (catalog); see docs/catalog.md
catalog_sku_count_9() {
  local id="$1" limit=39
  [ -n "$id" ] || { echo "sku: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "sku $id: empty" ;;
    *) echo "sku $id: $n of $limit" ;;
  esac
}

# split sku records (catalog); see docs/catalog.md
catalog_sku_split_10() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "sku: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "sku $id: empty" ;;
    *) echo "sku $id: $n of $limit" ;;
  esac
}

# check sku records (catalog); see docs/catalog.md
catalog_sku_check_11() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "sku: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "sku $id: empty" ;;
    *) echo "sku $id: $n of $limit" ;;
  esac
}

