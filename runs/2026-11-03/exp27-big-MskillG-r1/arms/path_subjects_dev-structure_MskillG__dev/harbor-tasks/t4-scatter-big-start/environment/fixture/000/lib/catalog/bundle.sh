#!/bin/bash
# catalog/bundle: bundle helpers for the catalog screens. No prices here.

# lookup bundle records (catalog); see docs/catalog.md
catalog_bundle_lookup_0() {
  local id="$1" limit=20
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# check bundle records (catalog); see docs/catalog.md
catalog_bundle_check_1() {
  local id="$1" limit=81
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# score bundle records (catalog); see docs/catalog.md
catalog_bundle_score_2() {
  local id="$1" limit=51
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# count bundle records (catalog); see docs/catalog.md
catalog_bundle_count_3() {
  local id="$1" limit=31
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# format bundle records (catalog); see docs/catalog.md
catalog_bundle_format_4() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# split bundle records (catalog); see docs/catalog.md
catalog_bundle_split_5() {
  local id="$1" limit=83
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# normalize bundle records (catalog); see docs/catalog.md
catalog_bundle_normalize_6() {
  local id="$1" limit=91
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# format bundle records (catalog); see docs/catalog.md
catalog_bundle_format_7() {
  local id="$1" limit=36
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# count bundle records (catalog); see docs/catalog.md
catalog_bundle_count_8() {
  local id="$1" limit=55
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# format bundle records (catalog); see docs/catalog.md
catalog_bundle_format_9() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# list bundle records (catalog); see docs/catalog.md
catalog_bundle_list_10() {
  local id="$1" limit=22
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# list bundle records (catalog); see docs/catalog.md
catalog_bundle_list_11() {
  local id="$1" limit=92
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

