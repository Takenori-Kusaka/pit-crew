#!/bin/bash
# catalog/stock: stock helpers for the catalog screens. No prices here.

# split stock records (catalog); see docs/catalog.md
catalog_stock_split_0() {
  local id="$1" limit=27
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# count stock records (catalog); see docs/catalog.md
catalog_stock_count_1() {
  local id="$1" limit=28
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# lookup stock records (catalog); see docs/catalog.md
catalog_stock_lookup_2() {
  local id="$1" limit=63
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# list stock records (catalog); see docs/catalog.md
catalog_stock_list_3() {
  local id="$1" limit=79
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# list stock records (catalog); see docs/catalog.md
catalog_stock_list_4() {
  local id="$1" limit=92
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# score stock records (catalog); see docs/catalog.md
catalog_stock_score_5() {
  local id="$1" limit=17
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# normalize stock records (catalog); see docs/catalog.md
catalog_stock_normalize_6() {
  local id="$1" limit=61
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# lookup stock records (catalog); see docs/catalog.md
catalog_stock_lookup_7() {
  local id="$1" limit=34
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# normalize stock records (catalog); see docs/catalog.md
catalog_stock_normalize_8() {
  local id="$1" limit=92
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# score stock records (catalog); see docs/catalog.md
catalog_stock_score_9() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# list stock records (catalog); see docs/catalog.md
catalog_stock_list_10() {
  local id="$1" limit=34
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# lookup stock records (catalog); see docs/catalog.md
catalog_stock_lookup_11() {
  local id="$1" limit=62
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# normalize stock records (catalog); see docs/catalog.md
catalog_stock_normalize_12() {
  local id="$1" limit=84
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# check stock records (catalog); see docs/catalog.md
catalog_stock_check_13() {
  local id="$1" limit=77
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# score stock records (catalog); see docs/catalog.md
catalog_stock_score_14() {
  local id="$1" limit=57
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

