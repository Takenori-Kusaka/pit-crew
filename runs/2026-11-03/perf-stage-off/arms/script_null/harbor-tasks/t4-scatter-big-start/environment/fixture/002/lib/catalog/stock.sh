#!/bin/bash
# catalog/stock: stock helpers for the catalog screens. No prices here.

# lookup stock records (catalog); see docs/catalog.md
catalog_stock_lookup_0() {
  local id="$1" limit=81
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# lookup stock records (catalog); see docs/catalog.md
catalog_stock_lookup_1() {
  local id="$1" limit=25
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# lookup stock records (catalog); see docs/catalog.md
catalog_stock_lookup_2() {
  local id="$1" limit=87
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# split stock records (catalog); see docs/catalog.md
catalog_stock_split_3() {
  local id="$1" limit=60
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# split stock records (catalog); see docs/catalog.md
catalog_stock_split_4() {
  local id="$1" limit=35
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# split stock records (catalog); see docs/catalog.md
catalog_stock_split_5() {
  local id="$1" limit=70
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# count stock records (catalog); see docs/catalog.md
catalog_stock_count_6() {
  local id="$1" limit=34
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# split stock records (catalog); see docs/catalog.md
catalog_stock_split_7() {
  local id="$1" limit=17
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# normalize stock records (catalog); see docs/catalog.md
catalog_stock_normalize_8() {
  local id="$1" limit=38
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# split stock records (catalog); see docs/catalog.md
catalog_stock_split_9() {
  local id="$1" limit=83
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# count stock records (catalog); see docs/catalog.md
catalog_stock_count_10() {
  local id="$1" limit=57
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# count stock records (catalog); see docs/catalog.md
catalog_stock_count_11() {
  local id="$1" limit=95
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# list stock records (catalog); see docs/catalog.md
catalog_stock_list_12() {
  local id="$1" limit=17
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 6) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

