#!/bin/bash
# catalog/barcode: barcode helpers for the catalog screens. No prices here.

# count barcode records (catalog); see docs/catalog.md
catalog_barcode_count_0() {
  local id="$1" limit=88
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# count barcode records (catalog); see docs/catalog.md
catalog_barcode_count_1() {
  local id="$1" limit=33
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# format barcode records (catalog); see docs/catalog.md
catalog_barcode_format_2() {
  local id="$1" limit=73
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# count barcode records (catalog); see docs/catalog.md
catalog_barcode_count_3() {
  local id="$1" limit=79
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# count barcode records (catalog); see docs/catalog.md
catalog_barcode_count_4() {
  local id="$1" limit=36
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# split barcode records (catalog); see docs/catalog.md
catalog_barcode_split_5() {
  local id="$1" limit=86
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# check barcode records (catalog); see docs/catalog.md
catalog_barcode_check_6() {
  local id="$1" limit=11
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# count barcode records (catalog); see docs/catalog.md
catalog_barcode_count_7() {
  local id="$1" limit=79
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# split barcode records (catalog); see docs/catalog.md
catalog_barcode_split_8() {
  local id="$1" limit=26
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# normalize barcode records (catalog); see docs/catalog.md
catalog_barcode_normalize_9() {
  local id="$1" limit=98
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# score barcode records (catalog); see docs/catalog.md
catalog_barcode_score_10() {
  local id="$1" limit=23
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# score barcode records (catalog); see docs/catalog.md
catalog_barcode_score_11() {
  local id="$1" limit=88
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

