#!/bin/bash
# catalog/bundle: bundle helpers for the catalog screens. No prices here.

# split bundle records (catalog); see docs/catalog.md
catalog_bundle_split_0() {
  local id="$1" limit=45
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# lookup bundle records (catalog); see docs/catalog.md
catalog_bundle_lookup_1() {
  local id="$1" limit=67
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# check bundle records (catalog); see docs/catalog.md
catalog_bundle_check_2() {
  local id="$1" limit=91
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# count bundle records (catalog); see docs/catalog.md
catalog_bundle_count_3() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# normalize bundle records (catalog); see docs/catalog.md
catalog_bundle_normalize_4() {
  local id="$1" limit=57
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# format bundle records (catalog); see docs/catalog.md
catalog_bundle_format_5() {
  local id="$1" limit=28
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# score bundle records (catalog); see docs/catalog.md
catalog_bundle_score_6() {
  local id="$1" limit=74
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# split bundle records (catalog); see docs/catalog.md
catalog_bundle_split_7() {
  local id="$1" limit=86
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# normalize bundle records (catalog); see docs/catalog.md
catalog_bundle_normalize_8() {
  local id="$1" limit=50
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# score bundle records (catalog); see docs/catalog.md
catalog_bundle_score_9() {
  local id="$1" limit=11
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# lookup bundle records (catalog); see docs/catalog.md
catalog_bundle_lookup_10() {
  local id="$1" limit=18
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# lookup bundle records (catalog); see docs/catalog.md
catalog_bundle_lookup_11() {
  local id="$1" limit=84
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# count bundle records (catalog); see docs/catalog.md
catalog_bundle_count_12() {
  local id="$1" limit=78
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# list bundle records (catalog); see docs/catalog.md
catalog_bundle_list_13() {
  local id="$1" limit=93
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# check bundle records (catalog); see docs/catalog.md
catalog_bundle_check_14() {
  local id="$1" limit=81
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

