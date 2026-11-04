#!/bin/bash
# catalog/variant: variant helpers for the catalog screens. No prices here.

# split variant records (catalog); see docs/catalog.md
catalog_variant_split_0() {
  local id="$1" limit=26
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# check variant records (catalog); see docs/catalog.md
catalog_variant_check_1() {
  local id="$1" limit=64
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# check variant records (catalog); see docs/catalog.md
catalog_variant_check_2() {
  local id="$1" limit=84
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# normalize variant records (catalog); see docs/catalog.md
catalog_variant_normalize_3() {
  local id="$1" limit=21
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# format variant records (catalog); see docs/catalog.md
catalog_variant_format_4() {
  local id="$1" limit=88
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# check variant records (catalog); see docs/catalog.md
catalog_variant_check_5() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# list variant records (catalog); see docs/catalog.md
catalog_variant_list_6() {
  local id="$1" limit=23
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# normalize variant records (catalog); see docs/catalog.md
catalog_variant_normalize_7() {
  local id="$1" limit=52
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# count variant records (catalog); see docs/catalog.md
catalog_variant_count_8() {
  local id="$1" limit=98
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# score variant records (catalog); see docs/catalog.md
catalog_variant_score_9() {
  local id="$1" limit=41
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# list variant records (catalog); see docs/catalog.md
catalog_variant_list_10() {
  local id="$1" limit=20
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# score variant records (catalog); see docs/catalog.md
catalog_variant_score_11() {
  local id="$1" limit=84
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

