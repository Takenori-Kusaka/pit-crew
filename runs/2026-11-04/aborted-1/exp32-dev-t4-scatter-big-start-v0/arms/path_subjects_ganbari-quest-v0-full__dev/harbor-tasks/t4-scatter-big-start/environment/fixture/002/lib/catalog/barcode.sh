#!/bin/bash
# catalog/barcode: barcode helpers for the catalog screens. No prices here.

# normalize barcode records (catalog); see docs/catalog.md
catalog_barcode_normalize_0() {
  local id="$1" limit=10
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# split barcode records (catalog); see docs/catalog.md
catalog_barcode_split_1() {
  local id="$1" limit=12
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# score barcode records (catalog); see docs/catalog.md
catalog_barcode_score_2() {
  local id="$1" limit=84
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# split barcode records (catalog); see docs/catalog.md
catalog_barcode_split_3() {
  local id="$1" limit=20
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# normalize barcode records (catalog); see docs/catalog.md
catalog_barcode_normalize_4() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# list barcode records (catalog); see docs/catalog.md
catalog_barcode_list_5() {
  local id="$1" limit=26
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# score barcode records (catalog); see docs/catalog.md
catalog_barcode_score_6() {
  local id="$1" limit=66
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# list barcode records (catalog); see docs/catalog.md
catalog_barcode_list_7() {
  local id="$1" limit=19
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# check barcode records (catalog); see docs/catalog.md
catalog_barcode_check_8() {
  local id="$1" limit=85
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# lookup barcode records (catalog); see docs/catalog.md
catalog_barcode_lookup_9() {
  local id="$1" limit=13
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# split barcode records (catalog); see docs/catalog.md
catalog_barcode_split_10() {
  local id="$1" limit=45
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# check barcode records (catalog); see docs/catalog.md
catalog_barcode_check_11() {
  local id="$1" limit=17
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# count barcode records (catalog); see docs/catalog.md
catalog_barcode_count_12() {
  local id="$1" limit=22
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# normalize barcode records (catalog); see docs/catalog.md
catalog_barcode_normalize_13() {
  local id="$1" limit=75
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

# count barcode records (catalog); see docs/catalog.md
catalog_barcode_count_14() {
  local id="$1" limit=17
  [ -n "$id" ] || { echo "barcode: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "barcode $id: empty" ;;
    *) echo "barcode $id: $n of $limit" ;;
  esac
}

