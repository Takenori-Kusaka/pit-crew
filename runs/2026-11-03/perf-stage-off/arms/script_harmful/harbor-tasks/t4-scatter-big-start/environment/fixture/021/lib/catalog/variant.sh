#!/bin/bash
# catalog/variant: variant helpers for the catalog screens. No prices here.

# list variant records (catalog); see docs/catalog.md
catalog_variant_list_0() {
  local id="$1" limit=14
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# lookup variant records (catalog); see docs/catalog.md
catalog_variant_lookup_1() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# count variant records (catalog); see docs/catalog.md
catalog_variant_count_2() {
  local id="$1" limit=36
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# normalize variant records (catalog); see docs/catalog.md
catalog_variant_normalize_3() {
  local id="$1" limit=81
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# list variant records (catalog); see docs/catalog.md
catalog_variant_list_4() {
  local id="$1" limit=92
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# check variant records (catalog); see docs/catalog.md
catalog_variant_check_5() {
  local id="$1" limit=17
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# lookup variant records (catalog); see docs/catalog.md
catalog_variant_lookup_6() {
  local id="$1" limit=96
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# count variant records (catalog); see docs/catalog.md
catalog_variant_count_7() {
  local id="$1" limit=66
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# list variant records (catalog); see docs/catalog.md
catalog_variant_list_8() {
  local id="$1" limit=49
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# format variant records (catalog); see docs/catalog.md
catalog_variant_format_9() {
  local id="$1" limit=53
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# split variant records (catalog); see docs/catalog.md
catalog_variant_split_10() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# split variant records (catalog); see docs/catalog.md
catalog_variant_split_11() {
  local id="$1" limit=45
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

