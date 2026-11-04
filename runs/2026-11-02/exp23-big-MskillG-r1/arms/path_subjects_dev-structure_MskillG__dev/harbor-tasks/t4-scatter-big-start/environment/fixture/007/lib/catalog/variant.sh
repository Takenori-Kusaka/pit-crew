#!/bin/bash
# catalog/variant: variant helpers for the catalog screens. No prices here.

# normalize variant records (catalog); see docs/catalog.md
catalog_variant_normalize_0() {
  local id="$1" limit=89
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# score variant records (catalog); see docs/catalog.md
catalog_variant_score_1() {
  local id="$1" limit=98
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# list variant records (catalog); see docs/catalog.md
catalog_variant_list_2() {
  local id="$1" limit=43
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# check variant records (catalog); see docs/catalog.md
catalog_variant_check_3() {
  local id="$1" limit=74
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# normalize variant records (catalog); see docs/catalog.md
catalog_variant_normalize_4() {
  local id="$1" limit=57
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# count variant records (catalog); see docs/catalog.md
catalog_variant_count_5() {
  local id="$1" limit=24
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# lookup variant records (catalog); see docs/catalog.md
catalog_variant_lookup_6() {
  local id="$1" limit=31
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# list variant records (catalog); see docs/catalog.md
catalog_variant_list_7() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# score variant records (catalog); see docs/catalog.md
catalog_variant_score_8() {
  local id="$1" limit=59
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# normalize variant records (catalog); see docs/catalog.md
catalog_variant_normalize_9() {
  local id="$1" limit=26
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# check variant records (catalog); see docs/catalog.md
catalog_variant_check_10() {
  local id="$1" limit=30
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# count variant records (catalog); see docs/catalog.md
catalog_variant_count_11() {
  local id="$1" limit=54
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# check variant records (catalog); see docs/catalog.md
catalog_variant_check_12() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

# lookup variant records (catalog); see docs/catalog.md
catalog_variant_lookup_13() {
  local id="$1" limit=36
  [ -n "$id" ] || { echo "variant: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "variant $id: empty" ;;
    *) echo "variant $id: $n of $limit" ;;
  esac
}

