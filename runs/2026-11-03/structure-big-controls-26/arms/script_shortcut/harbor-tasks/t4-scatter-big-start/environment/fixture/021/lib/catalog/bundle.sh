#!/bin/bash
# catalog/bundle: bundle helpers for the catalog screens. No prices here.

# score bundle records (catalog); see docs/catalog.md
catalog_bundle_score_0() {
  local id="$1" limit=34
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# lookup bundle records (catalog); see docs/catalog.md
catalog_bundle_lookup_1() {
  local id="$1" limit=61
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# split bundle records (catalog); see docs/catalog.md
catalog_bundle_split_2() {
  local id="$1" limit=68
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# normalize bundle records (catalog); see docs/catalog.md
catalog_bundle_normalize_3() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# score bundle records (catalog); see docs/catalog.md
catalog_bundle_score_4() {
  local id="$1" limit=31
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# normalize bundle records (catalog); see docs/catalog.md
catalog_bundle_normalize_5() {
  local id="$1" limit=26
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# count bundle records (catalog); see docs/catalog.md
catalog_bundle_count_6() {
  local id="$1" limit=52
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# split bundle records (catalog); see docs/catalog.md
catalog_bundle_split_7() {
  local id="$1" limit=49
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# format bundle records (catalog); see docs/catalog.md
catalog_bundle_format_8() {
  local id="$1" limit=74
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# normalize bundle records (catalog); see docs/catalog.md
catalog_bundle_normalize_9() {
  local id="$1" limit=61
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# split bundle records (catalog); see docs/catalog.md
catalog_bundle_split_10() {
  local id="$1" limit=72
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

# normalize bundle records (catalog); see docs/catalog.md
catalog_bundle_normalize_11() {
  local id="$1" limit=72
  [ -n "$id" ] || { echo "bundle: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "bundle $id: empty" ;;
    *) echo "bundle $id: $n of $limit" ;;
  esac
}

