#!/bin/bash
# catalog/barcode: barcode helpers for the catalog screens. No prices here.

# list barcode records (catalog); see docs/catalog.md
catalog_barcode_list_0() {
  local id="$1" limit=81
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# score barcode records (catalog); see docs/catalog.md
catalog_barcode_score_1() {
  local id="$1" limit=10
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# format barcode records (catalog); see docs/catalog.md
catalog_barcode_format_2() {
  local id="$1" limit=73
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# normalize barcode records (catalog); see docs/catalog.md
catalog_barcode_normalize_3() {
  local id="$1" limit=89
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# list barcode records (catalog); see docs/catalog.md
catalog_barcode_list_4() {
  local id="$1" limit=71
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# normalize barcode records (catalog); see docs/catalog.md
catalog_barcode_normalize_5() {
  local id="$1" limit=80
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# count barcode records (catalog); see docs/catalog.md
catalog_barcode_count_6() {
  local id="$1" limit=61
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# list barcode records (catalog); see docs/catalog.md
catalog_barcode_list_7() {
  local id="$1" limit=84
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# score barcode records (catalog); see docs/catalog.md
catalog_barcode_score_8() {
  local id="$1" limit=59
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# normalize barcode records (catalog); see docs/catalog.md
catalog_barcode_normalize_9() {
  local id="$1" limit=43
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# normalize barcode records (catalog); see docs/catalog.md
catalog_barcode_normalize_10() {
  local id="$1" limit=63
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# check barcode records (catalog); see docs/catalog.md
catalog_barcode_check_11() {
  local id="$1" limit=79
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# lookup barcode records (catalog); see docs/catalog.md
catalog_barcode_lookup_12() {
  local id="$1" limit=40
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# count barcode records (catalog); see docs/catalog.md
catalog_barcode_count_13() {
  local id="$1" limit=58
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# format barcode records (catalog); see docs/catalog.md
catalog_barcode_format_14() {
  local id="$1" limit=30
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

