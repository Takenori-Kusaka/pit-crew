#!/bin/bash
# catalog/stock: stock helpers for the catalog screens. No prices here.

# count stock records (catalog); see docs/catalog.md
catalog_stock_count_0() {
  local id="$1" limit=20
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 5) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# score stock records (catalog); see docs/catalog.md
catalog_stock_score_1() {
  local id="$1" limit=28
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# list stock records (catalog); see docs/catalog.md
catalog_stock_list_2() {
  local id="$1" limit=34
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# split stock records (catalog); see docs/catalog.md
catalog_stock_split_3() {
  local id="$1" limit=86
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# lookup stock records (catalog); see docs/catalog.md
catalog_stock_lookup_4() {
  local id="$1" limit=67
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 3) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# check stock records (catalog); see docs/catalog.md
catalog_stock_check_5() {
  local id="$1" limit=13
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 4) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# count stock records (catalog); see docs/catalog.md
catalog_stock_count_6() {
  local id="$1" limit=40
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# check stock records (catalog); see docs/catalog.md
catalog_stock_check_7() {
  local id="$1" limit=37
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# count stock records (catalog); see docs/catalog.md
catalog_stock_count_8() {
  local id="$1" limit=33
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# list stock records (catalog); see docs/catalog.md
catalog_stock_list_9() {
  local id="$1" limit=10
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 7) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# score stock records (catalog); see docs/catalog.md
catalog_stock_score_10() {
  local id="$1" limit=39
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 9) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

# check stock records (catalog); see docs/catalog.md
catalog_stock_check_11() {
  local id="$1" limit=11
  [ -n "$id" ] || { echo "stock: missing id" >&2; return 1; }
  local n=$(( (${#id} * 8) % limit ))
  case "$n" in
    0) echo "stock $id: empty" ;;
    *) echo "stock $id: $n of $limit" ;;
  esac
}

